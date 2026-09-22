import { getCache } from '@vercel/functions'
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
 * Vercel Runtime Cache is regional, so a plain write only reaches the region that handled the request.
 *
 * Each ref entry is tagged with its own key so a forced refresh can invalidate that pointer everywhere.
 */
export function githubRefCacheDriver(ttl: number): Driver {
  if (!cacheAvailable()) return memoryDriver()
  return vercelRuntimeCache({
    base: 'github:refs',
    ttl
  })
}

/**
 * Globally expire a ref pointer tagged with `tag`.
 *
 * No-op outside Vercel Runtime Cache (dev, tests): nothing to expire there.
 */
export async function expireGithubRef(tag: string): Promise<void> {
  if (!cacheAvailable()) return
  await getCache().expireTag(tag)
}
