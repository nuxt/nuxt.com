import { describe, expect, it } from 'vitest'
import { redirectOf, requestEvent } from '../utils/request-event'

const { default: handler } = await import('../../server/middleware/pull-preview')

/** Where the middleware sends `path`, or `undefined` when it serves it. The server receives the path URL-encoded. */
function middleware({ path }: { path: string }) {
  const event = requestEvent(encodeURI(path))
  handler(event)
  return redirectOf(event)
}

describe('pull preview middleware', () => {
  it('previews content pages', () => {
    expect(middleware({ path: '/pull/nuxt/1/docs/5.x/getting-started/introduction' })).toBeUndefined()
    expect(middleware({ path: '/pull/nuxt.com/1/blog/v4?x=1' })).toBeUndefined()
    expect(middleware({ path: '/pull/nuxt/1' })).toBeUndefined()
  })

  it('sends any other page to production, keeping the query', () => {
    expect(middleware({ path: '/pull/nuxt/1/dashboard/chat' })).toEqual({ location: '/dashboard/chat', status: 302 })
    expect(middleware({ path: '/pull/nuxt/1/changelog' })).toEqual({ location: '/changelog', status: 302 })
    expect(middleware({ path: '/pull/nuxt/1/login?redirect=/admin' })).toEqual({ location: '/login?redirect=/admin', status: 302 })
  })

  it.each(['//evil.com', '/\\evil.com', '/\\\\evil.com', '///evil.com'])('never redirects %s off the site', (rest) => {
    expect(middleware({ path: `/pull/nuxt/1${rest}` })).toEqual({ location: '/evil.com', status: 302 })
  })

  it('refuses a path browsers read as another host', () => {
    expect(() => middleware({ path: '/pull/nuxt/1/\t/evil.com' })).toThrow('Invalid preview path')
  })

  it('ignores anything that is not a preview', () => {
    expect(middleware({ path: '/dashboard/chat' })).toBeUndefined()
    expect(middleware({ path: '/pull/ui/1/dashboard/chat' })).toBeUndefined()
    expect(middleware({ path: '/pull/nuxt/1\\\\evil.com' })).toBeUndefined()
  })
})
