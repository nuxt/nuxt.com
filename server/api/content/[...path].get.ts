import { defineHandler, getRouterParam } from 'nuxt/server'
/**
 * The one live data endpoint for every instance: it resolves the target instance from the URL.
 * `handler()` dispatches `get`, `navigation`, `list` and the `manifest`/`snapshot` artifacts.
 * Not cached: no ISR rule, no cache-control. `useSearch` uses the immutable blob route instead.
 */
export default defineHandler(async (event) => {
  const segments = (getRouterParam(event, 'path', { decode: true }) ?? '').split('/').filter(Boolean)
  const content = await getInstanceAtHead(instanceKeyFromSegments(segments))

  return content.handler(event.req)
})
