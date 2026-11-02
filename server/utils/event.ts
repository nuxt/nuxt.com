import type { H3Event } from 'h3'
import type { RequestEvent } from 'nuxt/server'

/**
 * On Nuxt 4 a `nuxt/server` event proxies the h3 event it was built from, so
 * h3-typed helpers work on it. Only the types differ; this goes away with Nuxt 5.
 */
export function toH3Event(event: RequestEvent): H3Event {
  return event as unknown as H3Event
}
