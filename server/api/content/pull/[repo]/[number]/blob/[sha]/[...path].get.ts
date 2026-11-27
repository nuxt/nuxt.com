import { pullBasePath } from '#shared/utils/pull'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

/**
 * `/api/content/blob/:sha`, for the instance a pull request replaces: its search artifacts at the PR's commit.
 * Pinned to that commit, so cached forever (`isr: true`).
 */
export default defineHandler(async (event) => {
  const target = pullTargetFromEvent(event)
  const sha = getRouterParam(event, 'sha', { decode: true })
  const path = getRouterParam(event, 'path', { decode: true })
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
  const request = event.req
  const url = new URL(request.url)
  const pathname = url.pathname.replace(`${pullBasePath(target)}/blob/${sha}`, '')
  // A percent-encoded sha decodes to a valid one but leaves the pin in the URL: refuse it instead of caching a second copy.
  if (pathname === url.pathname) {
    throw createError({ status: 400, statusText: 'Malformed content commit' })
  }
  url.pathname = pathname

  return content.handler(new Request(url, request))
})
