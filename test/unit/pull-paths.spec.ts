import { describe, expect, it } from 'vitest'
import { CONTENT_INSTANCE_KEYS, instanceBasePath, instancePullPath, instanceRepo, navigationPath, pullNavigationPath } from '../../shared/utils/content'
import { instanceSource } from '../../server/utils/content/instances'
import { parsePullPath, parsePullTarget, pullApiPath, pullBasePath, pullRepoName } from '../../shared/utils/pull'

const PULL = { repo: 'nuxt', number: 33012 } as const

describe('parsePullTarget', () => {
  it('accepts the previewable repos', () => {
    expect(parsePullTarget('nuxt', '33012')).toEqual(PULL)
    expect(parsePullTarget('nuxt.com', '1')).toEqual({ repo: 'nuxt.com', number: 1 })
  })

  it.each([
    ['ui', '1'],
    ['nuxt', '0'],
    ['nuxt', '012'],
    ['nuxt', '1e3'],
    ['nuxt', '12345678901'],
    ['nuxt', undefined]
  ])('rejects %s#%s', (repo, number) => {
    expect(parsePullTarget(repo, number)).toBeNull()
  })
})

describe('parsePullPath', () => {
  it('splits the preview prefix from the page it mirrors', () => {
    expect(parsePullPath('/pull/nuxt/33012/docs/5.x/guide?x=1#y')).toEqual({
      target: PULL,
      path: '/docs/5.x/guide?x=1#y'
    })
  })

  it('mirrors the home page at the bare prefix', () => {
    expect(parsePullPath('/pull/nuxt.com/7')?.path).toBe('/')
    expect(parsePullPath('/pull/nuxt.com/7?x=1')?.path).toBe('/?x=1')
  })

  it('ignores anything else', () => {
    expect(parsePullPath('/docs/4.x/pull/nuxt/1')).toBeNull()
    expect(parsePullPath('/pull/ui/1/docs')).toBeNull()
    expect(parsePullPath('/pull/nuxt/1abc/docs')).toBeNull()
  })
})

describe('pull paths', () => {
  it('names the GitHub repo', () => {
    expect(pullRepoName('cli')).toBe('nuxt/cli')
  })

  it('mounts every endpoint under the same prefix', () => {
    expect(pullBasePath(PULL)).toBe('/pull/nuxt/33012')
    expect(pullApiPath(PULL)).toBe('/api/pull/nuxt/33012')
    expect(pullNavigationPath('5.x', PULL)).toBe('/api/navigation/pull/nuxt/33012/5.x')
  })

  it('reduces a preview content path to the live one by dropping the prefix', () => {
    expect(instancePullPath('docs:5.x', PULL)).toBe('/api/content/pull/nuxt/33012/docs/5.x')
    expect(instancePullPath('docs:5.x', PULL).replace(pullBasePath(PULL), '')).toBe(instanceBasePath('docs:5.x'))
    expect(pullNavigationPath('5.x', PULL).replace(pullBasePath(PULL), '')).toBe(navigationPath('5.x'))
  })
})

describe('instanceRepo', () => {
  it('agrees with `instanceSource(key).source.repo` for every instance', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(pullRepoName(instanceRepo(key)), key).toBe(instanceSource(key).source.repo)
    }
  })
})
