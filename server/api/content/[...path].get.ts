/**
 * The one live data endpoint for every instance: it resolves the target instance from the URL.
 * `handler()` dispatches `get`, `navigation`, `list` and the `manifest`/`snapshot` artifacts.
 * Not cached: no ISR rule, no cache-control. `useSearch` uses the immutable blob route instead.
 */
export default defineEventHandler(async (event) => {
  const segments = (getRouterParam(event, 'path') ?? '').split('/').filter(Boolean)
  const content = await getInstanceAtHead(instanceKeyFromSegments(segments))

  return content.handler(toWebRequest(event))
})
