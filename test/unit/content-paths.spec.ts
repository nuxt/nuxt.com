import { describe, expect, it } from 'vitest'
import { CONTENT_INSTANCE_KEYS, cliInstanceKey, docsInstanceKey, instanceBasePath, instanceBlobPath, instanceName, isContentInstanceKey, navPathsForInstance, navigationPath } from '../../shared/utils/content'
import { DOC_VERSIONS } from '../../shared/utils/docs'
import { instanceSource } from '../../server/utils/content/instances'

describe('content instance paths', () => {
  it('serves each instance under its own prefix', () => {
    expect(instanceBasePath('site')).toBe('/api/content/site')
    expect(instanceBasePath('examples')).toBe('/api/content/examples')
    expect(instanceBasePath(docsInstanceKey('4.x'))).toBe('/api/content/docs/4.x')
    expect(instanceBasePath(cliInstanceKey('4.x'))).toBe('/api/content/cli/4.x')
  })

  it('puts the qualifier before the instance path', () => {
    expect(instanceBlobPath(docsInstanceKey('3.x'), 'abc123')).toBe('/api/content/blob/abc123/docs/3.x')
  })

  it('reduces a pinned path to the live one by dropping the pin', () => {
    for (const key of ['site', 'examples', docsInstanceKey('4.x'), docsInstanceKey('5.x'), cliInstanceKey('4.x')] as const) {
      const sha = 'deadbeef'
      expect(instanceBlobPath(key, sha).replace(`/blob/${sha}`, '')).toBe(instanceBasePath(key))
    }
  })
})

describe('instanceName', () => {
  it('agrees with `instanceSource(key).name` for every instance', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(instanceName(key), key).toBe(instanceSource(key).name)
    }
  })
})

describe('navPathsForInstance', () => {
  it('scopes a docs or cli push to that version alone', () => {
    expect(navPathsForInstance(docsInstanceKey('4.x'))).toEqual([navigationPath('4.x')])
    expect(navPathsForInstance(cliInstanceKey('4.x'))).toEqual([navigationPath('4.x')])
  })

  it('fans `site` and `examples` out to every version — both are grafted onto every tree', () => {
    const everyVersion = DOC_VERSIONS.map(navigationPath)
    expect(navPathsForInstance('site')).toEqual(everyVersion)
    expect(navPathsForInstance('examples')).toEqual(everyVersion)
  })
})

describe('isContentInstanceKey', () => {
  it('accepts the instances nuxt.com serves', () => {
    expect(isContentInstanceKey('site')).toBe(true)
    expect(isContentInstanceKey('examples')).toBe(true)
    for (const version of ['3.x', '4.x', '5.x']) {
      expect(isContentInstanceKey(`docs:${version}`)).toBe(true)
      expect(isContentInstanceKey(`cli:${version}`)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    // Both resolvers key off this, so a wrong `true` would route a bad URL at a real instance.
    for (const value of ['', 'docs', 'docs:', 'docs:9.x', 'docs:4', 'cli:', 'cli:9.x', 'blog', 'deploy', 'site/blog', 'docsv4']) {
      expect(isContentInstanceKey(value)).toBe(false)
    }
  })
})
