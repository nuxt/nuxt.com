import { pullBasePath } from '#shared/utils/pull'
import { defineHandler, getRouterParam } from 'nuxt/server'

/**
 * The live endpoint, as a pull request previews it: the instance the PR replaces is pinned to its head commit.
 * Follows new pushes within the PR lookup's TTL, so no ISR rule.
 */
export default defineHandler(async (event) => {
  const target = pullTargetFromEvent(event)
  const segments = (getRouterParam(event, 'path', { decode: true }) ?? '').split('/').filter(Boolean)
  const key = instanceKeyFromSegments(segments)

  const preview = await resolvePullPreview(target)
  const content = await getInstanceForPull(preview, key)

  const request = event.req
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(pullBasePath(target), '')

  return content.handler(new Request(url, request))
})
