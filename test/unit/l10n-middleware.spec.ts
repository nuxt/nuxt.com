import { describe, expect, it, vi } from 'vitest'
import { redirectOf, requestEvent } from '../utils/request-event'

/** A few of the site's redirect rules, as Nitro's matcher returns them. */
const RULES = vi.hoisted((): Record<string, { to: string, _redirectStripBase?: string }> => ({
  '/docs': { to: '/docs/getting-started/introduction' },
  '/docs/4.x': { to: '/docs/4.x/getting-started/introduction' },
  '/docs/4.x/examples/hello-world': { to: '/docs/examples/**', _redirectStripBase: '/docs/4.x/examples' }
}))

vi.mock('nuxt/server', async importOriginal => ({
  ...await importOriginal<typeof import('nuxt/server')>(),
  matchRouteRules: (path: string) => ({ redirect: RULES[path] })
}))

const { default: handler } = await import('../../server/middleware/l10n')

/** Where the middleware sends `path`, or `undefined` when it serves it. The server receives the path URL-encoded. */
function middleware({ path }: { path: string }) {
  const event = requestEvent(encodeURI(path))
  handler(event)
  return redirectOf(event)
}

describe('l10n middleware', () => {
  it('should serve localised pages', () => {
    expect(middleware({ path: '/fr/docs/4.x/getting-started/introduction' })).toBeUndefined()
    expect(middleware({ path: '/fr/docs/3.x/guide?x=1' })).toBeUndefined()
    expect(middleware({ path: '/de/docs/4.x/getting-started/introduction' })).toBeUndefined()
  })

  it('should send the locale and docs roots to the localised index', () => {
    expect(middleware({ path: '/fr' })).toEqual({ location: '/fr/docs/4.x/getting-started/introduction', status: 302 })
    expect(middleware({ path: '/fr/docs' })).toEqual({ location: '/fr/docs/4.x/getting-started/introduction', status: 302 })
    expect(middleware({ path: '/fr/docs/4.x' })).toEqual({ location: '/fr/docs/4.x/getting-started/introduction', status: 302 })
  })

  it('should follow wildcard redirect rules to the English page', () => {
    expect(middleware({ path: '/fr/docs/4.x/examples/hello-world' })).toEqual({ location: '/docs/examples/hello-world', status: 302 })
  })

  it('should send agents, raw markdown and the rest of the site to English', () => {
    expect(middleware({ path: '/fr/llms.txt' })).toEqual({ location: '/llms.txt', status: 302 })
    expect(middleware({ path: '/fr/llms-full.txt' })).toEqual({ location: '/llms-full.txt', status: 302 })
    expect(middleware({ path: '/fr/raw/docs/4.x/guide.md' })).toEqual({ location: '/raw/docs/4.x/guide.md', status: 302 })
    expect(middleware({ path: '/fr/mcp' })).toEqual({ location: '/mcp', status: 302 })
    expect(middleware({ path: '/fr/modules?q=ui' })).toEqual({ location: '/modules?q=ui', status: 302 })
  })

  it('should send docs under an unknown locale to English', () => {
    expect(middleware({ path: '/es/docs/4.x/guide' })).toEqual({ location: '/docs/4.x/guide', status: 302 })
  })

  it('should refuse a path browsers read as another host', () => {
    expect(() => middleware({ path: '/fr/\t/evil.com' })).toThrow('Invalid localised path')
  })

  it('should ignore English URLs', () => {
    expect(middleware({ path: '/docs/4.x/guide' })).toBeUndefined()
    expect(middleware({ path: '/modules' })).toBeUndefined()
  })
})
