/**
 * The one live data endpoint for every instance: it resolves the target instance from the URL.
 * `handler()` dispatches `get`, `navigation`, `list` and the `manifest`/`snapshot` artifacts.
 * Must be cached per-URL.
 */
export default defineEventHandler(async (event) => {
  const segments = (getRouterParam(event, 'path') ?? '').split('/').filter(Boolean)
  const content = await getInstance(instanceFromSegments(segments))

  return content.handler(toWebRequest(event))
})
