import { describe, expect, it, vi } from 'vitest'

/** The middleware reaches for these through Nitro's auto-imports. */
vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('sendRedirect', (_event: unknown, location: string, status: number) => ({ location, status }))

type Middleware = (event: { path: string }) => unknown
const middleware = (await import('../../server/middleware/pull-preview')).default as unknown as Middleware

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

  it('ignores anything that is not a preview', () => {
    expect(middleware({ path: '/dashboard/chat' })).toBeUndefined()
    expect(middleware({ path: '/pull/ui/1/dashboard/chat' })).toBeUndefined()
  })
})
