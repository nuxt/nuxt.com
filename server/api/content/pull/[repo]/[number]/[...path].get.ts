import { pullBasePath } from '#shared/utils/pull'

/**
 * The live endpoint, as a pull request previews it: the instances the PR targets are pinned to its head commit.
 * Follows new pushes within the PR lookup's TTL, so no ISR rule.
 */
export default defineEventHandler(async (event) => {
  const target = pullTargetFromEvent(event)
  const segments = (getRouterParam(event, 'path') ?? '').split('/').filter(Boolean)
  const key = instanceKeyFromSegments(segments)

  const preview = await resolvePullPreview(target)
  const content = await pullResolver(preview)(key)

  // `handler()` matches on its own `basePath` (`/api/content/<instance>`), so drop the PR.
  const request = toWebRequest(event)
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(pullBasePath(target), '')

  return content.handler(new Request(url, request))
})
