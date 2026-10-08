import { pullBasePath } from '#shared/utils/pull'

/**
 * `/api/content/blob/:sha`, for the instance a pull request replaces: its search artifacts at the PR's commit.
 * Pinned to that commit, so cached forever (`isr: true`).
 */
export default defineEventHandler(async (event) => {
  const target = pullTargetFromEvent(event)
  const sha = getRouterParam(event, 'sha')
  const path = getRouterParam(event, 'path')
  if (!sha || !path) {
    throw createError({ status: 400, statusText: 'Missing sha or path' })
  }
  if (!/^[0-9a-f]{7,40}$/.test(sha)) {
    throw createError({ status: 400, statusText: 'Malformed content commit' })
  }

  const key = instanceKeyFromSegments(path.split('/').filter(Boolean))
  const preview = await resolvePullPreview(target)

  // Anything but the PR's current commit would be cached forever under a stale URL.
  if (key !== preview.instanceKey || sha !== preview.sha) {
    throw createError({ status: 404, statusText: 'Stale content commit' })
  }

  const content = await getInstanceAtPull(key, sha)

  // `handler()` matches on its own `basePath` (`/api/content/<instance>`), so drop the PR and the pin.
  const request = toWebRequest(event)
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(`${pullBasePath(target)}/blob/${sha}`, '')

  return content.handler(new Request(url, request))
})
