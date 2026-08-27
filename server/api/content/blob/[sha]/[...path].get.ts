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

  const key = instanceFromSegments(path.split('/').filter(Boolean))

  // Resolving the instance is what advances its SHA, so compare after
  // Otherwise the first request after a push always 404s
  const content = await getInstance(key)
  if (sha !== await getInstanceSha(key)) {
    throw createError({ statusCode: 404, statusMessage: 'Stale content commit' })
  }

  // `handler()` matches on its own `basePath` (`/api/content/<instance>`), so drop the pin.
  const request = toWebRequest(event)
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(`/blob/${sha}`, '')

  return content.handler(new Request(url, request))
})
