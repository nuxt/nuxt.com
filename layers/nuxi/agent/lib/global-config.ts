import { getAll } from '@vercel/global-config'

/**
 * Every consumer (`workflow/config.ts`, `discord/access.ts`, ...) reads its own
 * key(s) independently, and a single logical operation (e.g. one scheduled
 * digest) can call several of them — each a network round trip to the same
 * store. This cache dedupes those into one fetch per key set per TTL window,
 * and turns a Global Config outage into a logged warning + empty result
 * instead of an unhandled throw (the SDK throws on invalid tokens, deleted
 * stores, and network errors).
 */
const TTL_MS = 30_000

interface CacheEntry {
  value: Record<string, unknown>
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<Record<string, unknown>>>()

/** Stable cache key for a key set, order-independent. */
function cacheKeyFor(keys: readonly string[]): string {
  return [...keys].sort().join(',')
}

/**
 * Reads one or more Global Config keys, cached for `TTL_MS` and deduped across
 * concurrent callers. Never throws — a read failure logs a warning and
 * resolves to `{}`, so callers keep their own `?? default` fallback.
 */
export async function readGlobalConfig<T extends Record<string, unknown>>(
  keys: readonly (keyof T & string)[]
): Promise<Partial<T>> {
  const cacheKey = cacheKeyFor(keys)
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value as Partial<T>

  const existing = inflight.get(cacheKey)
  if (existing) return existing as Promise<Partial<T>>

  // No store configured (e.g. local dev without `GLOBAL_CONFIG`): nothing to read
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) return {}

  // The SDK creates its client lazily and throws synchronously on an invalid
  // connection string, so call it inside the chain to route that to `.catch`
  const promise = Promise.resolve()
    .then(() => getAll<T>([...keys]))
    .then((value) => {
      cache.set(cacheKey, { value, expiresAt: Date.now() + TTL_MS })
      return value
    })
    .catch((error: unknown) => {
      console.warn('[nuxi:global-config] read failed, using defaults', { keys, error })
      return {}
    })
    .finally(() => {
      inflight.delete(cacheKey)
    })

  inflight.set(cacheKey, promise)
  return promise
}

/** Test-only: clears the cache so a test can simulate a fresh read with a different mocked value. */
export function resetGlobalConfigCache(): void {
  cache.clear()
  inflight.clear()
}
