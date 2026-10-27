/**
 * SHA-pinned mirror of the live endpoint, serving the artifacts the client-side search database
 * hydrates from (`manifest.json`, `snapshot/<source>`).
 *
 * The pin is what makes the response immutable, so it can be cached forever (`isr: true`).
 */
export default defineEventHandler(async (event) => {
  const sha = getRouterParam(event, 'sha')
  const path = getRouterParam(event, 'path')
  if (!sha || !path) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sha or path' })
  }
  // This URL is public and unauthenticated, so reject anything that cannot be a commit
  if (!/^[0-9a-f]{7,40}$/.test(sha)) {
    throw createError({ statusCode: 400, statusMessage: 'Malformed content commit' })
  }

  const key = instanceKeyFromSegments(path.split('/').filter(Boolean))

  // Ensure the sha is the latest.
  // Deliberately no `{ refresh: true }` retry: that bypasses the ref cache, so any well-formed-but-wrong sha would cost a live GitHub query.
  if (sha !== await resolveInstanceSha(key)) {
    throw createError({ statusCode: 404, statusMessage: 'Stale content commit' })
  }

  const content = await getInstanceAtHead(key)

  // `handler()` matches on its own `basePath` (`/api/content/<instance>`), so drop the pin.
  const request = toWebRequest(event)
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(`/blob/${sha}`, '')

  return content.handler(new Request(url, request))
})
