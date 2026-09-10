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
export const CONTENT_PARSER_VERSION = 'v3'

/**
 * Driver backing one instance's manifest, parsed bodies and snapshot artifacts.
 *
 * The namespace is:
 * - Per instance: a push to one repo leaves every other instance's cache untouched.
 * - Per commit: a new commit reads from a new namespace.
 * - Per parser version: `CONTENT_PARSER_VERSION` ensures a parser change rotates namespaces.
 */
export function contentCacheDriver(instanceKey: string, sha: string): Driver {
  if (!cacheAvailable()) return memoryDriver()
  return vercelRuntimeCache({
    base: `content:${CONTENT_PARSER_VERSION}:${instanceKey}:${sha}`,
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
