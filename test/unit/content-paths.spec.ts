import { describe, expect, it } from 'vitest'
import { docsInstanceKey, instanceBasePath, instanceBlobPath, instanceHeadPath, isContentInstanceKey } from '../../shared/utils/content'

describe('content instance paths', () => {
  it('serves each instance under its own prefix', () => {
    expect(instanceBasePath('site')).toBe('/api/content/site')
    expect(instanceBasePath('examples')).toBe('/api/content/examples')
    expect(instanceBasePath(docsInstanceKey('4.x'))).toBe('/api/content/docs/4.x')
  })

  it('puts the qualifier before the instance path', () => {
    expect(instanceHeadPath(docsInstanceKey('3.x'))).toBe('/api/content/head/docs/3.x')
    expect(instanceBlobPath(docsInstanceKey('3.x'), 'abc123')).toBe('/api/content/blob/abc123/docs/3.x')
  })

  it('reduces a pinned path to the live one by dropping the pin', () => {
    // The contract `server/api/content/blob/[sha]/[...path]` relies on: it strips `/blob/<sha>` and
    // hands the result to a handler mounted on `instanceBasePath`. If these two ever disagree, the
    // pinned route 404s on every artifact.
    for (const key of ['site', 'examples', docsInstanceKey('4.x'), docsInstanceKey('5.x')] as const) {
      const sha = 'deadbeef'
      expect(instanceBlobPath(key, sha).replace(`/blob/${sha}`, '')).toBe(instanceBasePath(key))
    }
  })
})

describe('isContentInstanceKey', () => {
  it('accepts the instances nuxt.com serves', () => {
    expect(isContentInstanceKey('site')).toBe(true)
    expect(isContentInstanceKey('examples')).toBe(true)
    for (const version of ['3.x', '4.x', '5.x']) {
      expect(isContentInstanceKey(`docs:${version}`)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    // Both resolvers key off this, so a wrong `true` would route a bad URL at a real instance.
    for (const value of ['', 'docs', 'docs:', 'docs:9.x', 'docs:4', 'blog', 'deploy', 'site/blog', 'docsv4']) {
      expect(isContentInstanceKey(value)).toBe(false)
    }
  })
})
