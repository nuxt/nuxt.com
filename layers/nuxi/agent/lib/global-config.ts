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

  const promise = getAll<T>(keys)
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
