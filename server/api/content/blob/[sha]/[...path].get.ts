import { createError, defineHandler, getRouterParam } from 'nuxt/server'
/**
 * SHA-pinned mirror of the live endpoint, serving the artifacts the client-side search database
 * hydrates from (`manifest.json`, `snapshot/<source>`).
 *
 * The pin is what makes the response immutable, so it can be cached forever (`isr: true`).
 */
export default defineHandler(async (event) => {
  const sha = getRouterParam(event, 'sha', { decode: true })
  const path = getRouterParam(event, 'path', { decode: true })
  if (!sha || !path) {
    throw createError({ status: 400, statusText: 'Missing sha or path' })
  }
  // This URL is public and unauthenticated, so reject anything that cannot be a commit
  if (!/^[0-9a-f]{7,40}$/.test(sha)) {
    throw createError({ status: 400, statusText: 'Malformed content commit' })
  }

  const key = instanceKeyFromSegments(path.split('/').filter(Boolean))

  // Ensure the sha is the latest.
  // Deliberately no `{ refresh: true }` retry: that bypasses the ref cache, so any well-formed-but-wrong sha would cost a live GitHub query.
  if (sha !== await resolveInstanceSha(key)) {
    throw createError({ status: 404, statusText: 'Stale content commit' })
  }

  const content = await getInstanceAtHead(key)

  // `handler()` matches on its own `basePath` (`/api/content/<instance>`), so drop the pin.
  const request = event.req
  const url = new URL(request.url)
  const pathname = url.pathname.replace(`/blob/${sha}`, '')
  // A percent-encoded sha decodes to a valid one but leaves the pin in the URL: refuse it instead of caching a second copy.
  if (pathname === url.pathname) {
    throw createError({ status: 400, statusText: 'Malformed content commit' })
  }
  url.pathname = pathname

  return content.handler(new Request(url, request))
})
