/**
 * Resolve the instance an `/api/content/...` request targets from its leading path segments:
 * - `site/…` (nuxt.com's own content: blog, deploy, landing pages…)
 * - `examples/…` (the examples instance, code examples)
 * - `docs/<version>/…` (one instance per docs version)
 */
function instanceFrom(segments: string[]): ContentInstanceKey {
  const [first, second] = segments

  if (first === 'site' || first === 'examples') {
    return first
  }
  if (first === 'docs' && second && isDocVersion(second)) {
    return docsInstanceKey(second)
  }

  throw createError({ statusCode: 404, statusMessage: 'Unknown content instance' })
}

/**
 * The one data endpoint for every instance: it resolves the target instance from the URL.
 * `handler()` dispatches `get`, `navigation`, `list` and artifact routes.
 * Must be cached per-URL.
 */
export default defineEventHandler(async (event) => {
  const segments = (getRouterParam(event, 'path') ?? '').split('/').filter(Boolean)
  const content = await getInstance(instanceFrom(segments))

  return content.handler(toWebRequest(event))
})
