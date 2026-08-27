import { instanceBasePath, instanceBlobPath } from '#shared/utils/content'

/**
 * Where to read an instance from, and what it contains.
 *
 * Consumed by the client-side search database (see `useSearch`).
 *
 * Immutable per-commit artifacts, CDN-cached forever.
 */
export default defineEventHandler(async (event) => {
  const key = instanceFromSegments((getRouterParam(event, 'path') ?? '').split('/').filter(Boolean))
  const sources = Object.keys(instanceSources(key))

  // Dev reads content from local directories, so there is no commit to pin to.
  if (import.meta.dev) {
    return { base: instanceBasePath(key), sha: null, sources }
  }

  const sha = await getInstanceSha(key)
  if (!sha) {
    throw createError({ statusCode: 503, statusMessage: `No commit resolved for content instance ${key}` })
  }

  return { base: instanceBlobPath(key, sha), sha, sources }
})
