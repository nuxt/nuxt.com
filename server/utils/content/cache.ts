import type { Driver } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import vercelRuntimeCache from 'unstorage/drivers/vercel-runtime-cache'

/**
 * SHA-addressed content is immutable, so it can be cached for a long time.
 */
const TTL = 60 * 60 * 24

/** Whether the Vercel Runtime Cache is available */
function cacheAvailable(): boolean {
  return !import.meta.dev && Boolean(process.env.VERCEL)
}

/**
 * Bump when content parser/plugin changes (TODO: automate this)
 */
export const CONTENT_PARSER_VERSION = 'v5'

/**
 * Driver backing one instance's manifest, parsed bodies and snapshot artifacts.
 *
 * Per instance and per parser version.
 *
 * (`withRef(sha)` namespaces every key it stores with the ref it pins)
 */
export function contentCacheDriver(instanceKey: string): Driver {
  if (!cacheAvailable()) return memoryDriver()
  return vercelRuntimeCache({
    base: `content:${CONTENT_PARSER_VERSION}:${instanceKey}`,
    ttl: TTL
  })
}

/**
 * Driver backing the ref pointers: `(repo, branch, content dir) -> commit sha`.
 * The caller supplies the bounded default TTL; individual entries may write a shorter one.
 *
 * TODO: Keep in thoughts: Vercel Runtime Cache is **regional**, not global (https://vercel.com/docs/caching/runtime-cache):
 * The webhook's forced refresh only reaches its own region, and the others self-heal on TTL.
 * A globally replicated store (e.g. Edge Config) would remove that bound.
 */
export function githubRefCacheDriver(ttl: number): Driver {
  if (!cacheAvailable()) return memoryDriver()
  return vercelRuntimeCache({
    base: 'github:refs',
    ttl
  })
}
