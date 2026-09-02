import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import { isContentRoute, rawUrlForPage } from '../../server/utils/content/routes'

/** The stub (`test/stubs/agent-discovery.ts`) never reads `event`, so any value type-checks. */
const event = {} as H3Event

describe('isContentRoute', () => {
  it('accepts real pages', () => {
    expect(isContentRoute('/')).toBe(true)
    expect(isContentRoute('/docs/4.x/getting-started/introduction')).toBe(true)
    expect(isContentRoute('/blog/v4')).toBe(true)
    expect(isContentRoute('/deploy/vercel')).toBe(true)
    expect(isContentRoute('/showcase')).toBe(true)
  })

  it('rejects content with no route of its own', () => {
    expect(isContentRoute('/design')).toBe(false)
    expect(isContentRoute('/info')).toBe(false)
    expect(isContentRoute('/enterprise/manual-sponsors')).toBe(false)
    expect(isContentRoute('/enterprise/support')).toBe(false)
    expect(isContentRoute('/templates/agency-os')).toBe(false)
    expect(isContentRoute('/video-courses/mastering-nuxt')).toBe(false)
  })

  it('keeps the listing page itself, only rejecting its children', () => {
    expect(isContentRoute('/templates')).toBe(true)
    expect(isContentRoute('/video-courses')).toBe(true)
  })
})

describe('rawUrlForPage', () => {
  it('resolves a page under an agentDiscovery route to its raw twin', () => {
    expect(rawUrlForPage(event, '/docs/4.x/getting-started/introduction'))
      .toBe('/raw/docs/4.x/getting-started/introduction.md')
    expect(rawUrlForPage(event, '/blog/v4')).toBe('/raw/blog/v4.md')
  })

  it('honours an exact route\'s explicit `raw` override, not the default destination', () => {
    expect(rawUrlForPage(event, '/')).toBe('/raw/index.md')
    expect(rawUrlForPage(event, '/modules')).toBe('/raw/modules.md')
    expect(rawUrlForPage(event, '/changelog')).toBe('/raw/changelog.md')
  })

  it('returns undefined for a page not in agentDiscovery.routes', () => {
    // The regression this guards: the old implementation hardcoded `/raw/<path>.md` for every
    // page, so these 404'd on purge instead of being skipped.
    expect(rawUrlForPage(event, '/showcase')).toBeUndefined()
    expect(rawUrlForPage(event, '/team')).toBeUndefined()
    expect(rawUrlForPage(event, '/design-kit')).toBeUndefined()
  })
})
