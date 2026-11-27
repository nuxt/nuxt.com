import type { RequestEvent } from 'nuxt/server'

interface RequestEventInit {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  /** The route params, as the server router matched them. */
  params?: Record<string, string>
  /** Aborts like the request of a visitor who disconnects. */
  signal?: AbortSignal
}

/** A `nuxt/server` event for `path` on nuxt.com, as a route handler receives it. */
export function requestEvent(path = '/', { method = 'GET', headers = {}, body, params = {}, signal }: RequestEventInit = {}): RequestEvent {
  const req = new Request(new URL(path, 'https://nuxt.com'), {
    method,
    headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  })
  return { req, url: new URL(req.url), res: { headers: new Headers() }, context: { params } }
}

/** Where a handler that called `sendRedirect` sends the browser, or `undefined` when it let the request through. */
export function redirectOf(event: RequestEvent): { location: string, status: number } | undefined {
  const location = event.res.headers.get('location')
  return location ? { location, status: event.res.status! } : undefined
}
