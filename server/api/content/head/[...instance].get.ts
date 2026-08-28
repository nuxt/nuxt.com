import { instanceBasePath, instanceBlobPath } from '#shared/utils/content'

/**
 * Where to read an instance from, and what it contains.
 */
export default defineEventHandler(async (event) => {
  const key = instanceKeyFromSegments((getRouterParam(event, 'instance') ?? '').split('/').filter(Boolean))
  const { name } = instanceSource(key)

  // Dev reads content from local directories, so there is no commit to pin to.
  if (import.meta.dev) {
    return { base: instanceBasePath(key), sha: null, sources: [name] }
  }

  const sha = await resolveInstanceSha(key)

  return { base: instanceBlobPath(key, sha), sha, sources: [name] }
})
