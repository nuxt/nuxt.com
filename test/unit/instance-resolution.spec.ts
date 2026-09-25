import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'

/**
 * `instances.ts` throws via `createError`, which Nitro auto-imports from `h3`. Vitest has no
 * auto-imports, so it's stubbed on `globalThis` with the real implementation.
 */
vi.stubGlobal('createError', createError)

const { instanceFromPagePath, instanceKeyFromSegments } = await import('../../server/utils/content/instances')

describe('instanceFromPagePath', () => {
  it('resolves a docs page to its version', () => {
    expect(instanceFromPagePath('/docs/4.x/getting-started/introduction')).toBe('docs:4.x')
    expect(instanceFromPagePath('/docs/3.x/getting-started/introduction')).toBe('docs:3.x')
  })

  it('resolves a command reference page to the cli instance, not docs', () => {
    // The regression this guards: the cli prefix is nested inside the docs prefix, so a naive
    // version-only match would misroute every command page to the docs instance.
    expect(instanceFromPagePath('/docs/4.x/api/commands/dev')).toBe('cli:4.x')
    expect(instanceFromPagePath('/docs/4.x/api/commands')).toBe('cli:4.x')
  })

  it('resolves a sibling of the commands prefix to docs, not cli', () => {
    expect(instanceFromPagePath('/docs/4.x/api/utils')).toBe('docs:4.x')
  })

  it('resolves examples, which are not version-scoped', () => {
    expect(instanceFromPagePath('/docs/examples/state-management')).toBe('examples')
  })

  it('falls through unversioned /docs/* and anything else to site', () => {
    expect(instanceFromPagePath('/docs/getting-started')).toBe('site')
    expect(instanceFromPagePath('/blog/v4')).toBe('site')
    expect(instanceFromPagePath('/')).toBe('site')
  })
})

describe('instanceKeyFromSegments', () => {
  it('resolves docs and cli, both two-segment prefixes', () => {
    expect(instanceKeyFromSegments(['docs', '4.x', 'getting-started'])).toBe('docs:4.x')
    expect(instanceKeyFromSegments(['cli', '4.x', 'dev'])).toBe('cli:4.x')
  })

  it('resolves site and examples, both one-segment prefixes', () => {
    expect(instanceKeyFromSegments(['site', 'blog', 'v4'])).toBe('site')
    expect(instanceKeyFromSegments(['examples', 'state-management'])).toBe('examples')
  })

  it('rejects an unknown prefix rather than falling back to site', () => {
    // Unlike `instanceFromPagePath`, a bad `/api/content/**` URL is a bad request, not site content.
    expect(() => instanceKeyFromSegments(['blog', 'v4'])).toThrow('Unknown content instance')
    expect(() => instanceKeyFromSegments(['docs', '9.x'])).toThrow('Unknown content instance')
    expect(() => instanceKeyFromSegments(['cli', '9.x'])).toThrow('Unknown content instance')
  })
})
