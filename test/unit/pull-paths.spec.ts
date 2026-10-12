import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CONTENT_INSTANCE_KEYS, instanceBasePath, instanceBlobPath, navigationPath } from '../../shared/utils/content'
import { instanceSource } from '../../server/utils/content/instances'
import { instancePullBlobPath, instancePullPath, instanceRepo, isPullContentPage, parsePullPath, parsePullTarget, pullApiPath, pullBasePath, pullHeadPath, pullNavigationPath, pullRepoName } from '../../shared/utils/pull'

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
    expect(pullHeadPath(PULL)).toBe('/api/content/pull/nuxt/33012/head')
  })

  it('reduces a preview content path to the live one by dropping the prefix', () => {
    expect(instancePullPath('docs:5.x', PULL)).toBe('/api/content/pull/nuxt/33012/docs/5.x')
    expect(instancePullPath('docs:5.x', PULL).replace(pullBasePath(PULL), '')).toBe(instanceBasePath('docs:5.x'))
    expect(pullNavigationPath('5.x', PULL).replace(pullBasePath(PULL), '')).toBe(navigationPath('5.x'))
    expect(instancePullBlobPath('docs:5.x', PULL, 'abc123').replace(pullBasePath(PULL), '')).toBe(instanceBlobPath('docs:5.x', 'abc123'))
  })
})

describe('instanceRepo', () => {
  it('agrees with `instanceSource(key).source.repo` for every instance', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(pullRepoName(instanceRepo(key)), key).toBe(instanceSource(key).source.repo)
    }
  })
})

describe('isPullContentPage', () => {
  it('matches exact pages and `/**` prefixes, including the prefix itself', () => {
    expect(isPullContentPage('/')).toBe(true)
    expect(isPullContentPage('/blog')).toBe(true)
    expect(isPullContentPage('/blog/v4')).toBe(true)
    expect(isPullContentPage('/modules')).toBe(true)
    expect(isPullContentPage('/modules/ui')).toBe(false)
    expect(isPullContentPage('/blogs')).toBe(false)
  })

  it('ignores the query, hash and trailing slash', () => {
    expect(isPullContentPage('/templates/?x=1#y')).toBe(true)
    expect(isPullContentPage('/login?redirect=/blog')).toBe(false)
  })
})

/** Docs tree pages rendering docs data without `useContent()`. */
const DOCS_PAGES_WITHOUT_CONTENT = new Set(['app/pages/docs/[version]/errors/index.vue'])

/** A URL a page file serves: `blog/[slug].vue` → `/blog/x`, `docs/[...slug].vue` → `/docs/x/y`. */
function samplePath(file: string): string {
  return file
    .replace(/^.*\/pages/, '')
    .replace(/(\/index)?\.vue$/, '')
    .replace(/\[\.\.\.\w+\]/g, 'x/y')
    .replace(/\[\w+\]/g, 'x') || '/'
}

describe('PULL_CONTENT_PAGES', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const pages = ['app/pages', ...readdirSync(join(root, 'layers')).map(layer => `layers/${layer}/app/pages`)]
    .filter(dir => existsSync(join(root, dir)))
    .flatMap(dir => readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })
      .filter(file => file.endsWith('.vue'))
      .map(file => `${dir}/${file}`))

  it.each(pages)('previews %s only if it renders content', (file) => {
    const rendersContent = DOCS_PAGES_WITHOUT_CONTENT.has(file) || readFileSync(join(root, file), 'utf8').includes('useContent(')

    expect(isPullContentPage(samplePath(file))).toBe(rendersContent)
  })
})
