import type { AuditableLogger } from 'evlog'
import type { RequestEvent } from 'nuxt/server'

declare module 'nuxt/schema' {
  interface RequestEventContext {
    /** The request's wide event, attached by evlog's Nitro plugin. */
    log?: AuditableLogger
  }
}

/**
 * evlog's `useLogger` for a `nuxt/server` event: evlog types its argument as an h3 event, but the logger
 * lives in `event.context`, which both kinds of event share.
 */
export function useRequestLogger(event: Pick<RequestEvent, 'context'>): AuditableLogger {
  const log = event.context.log
  if (!log) throw new Error('[evlog] Logger not initialized: the evlog Nuxt module must be installed.')
  return log
}
