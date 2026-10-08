import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import memoryDriver from 'unstorage/drivers/memory'
import type { NavigationItem } from 'comark-content'
import { instanceSource } from '../../server/utils/content/instances'
import { findByPath } from '../../server/utils/content/navigation'
import type { ContentInstanceKey } from '../../shared/utils/content'

const SHA = 'a'.repeat(40)

/** GitHub's answers, by URL. */
const github = vi.fn<(url: string) => unknown>()

/** `pull.ts` reaches for these through Nitro's auto-imports. */
vi.stubGlobal('createError', createError)
vi.stubGlobal('githubRefCacheDriver', () => memoryDriver())
vi.stubGlobal('contentGithubToken', () => 'tok')
vi.stubGlobal('instanceSource', instanceSource)
vi.stubGlobal('$fetch', vi.fn(async (url: string) => github(url)))

/** What the PR's pinned instance answers, and production's navigation per instance. */
const pageStat = vi.fn()
const pullNav = vi.fn<() => NavigationItem[]>(() => [])
const headNavs = new Map<ContentInstanceKey, NavigationItem[]>()

vi.mock('../../utils/factory', () => ({
  createRuntimeInstance: () => ({
    withRef: () => ({ init: async () => {}, stat: pageStat, navigation: async () => pullNav() })
  })
}))
vi.stubGlobal('instanceSourceFor', () => ({}))
vi.stubGlobal('contentCacheDriver', () => undefined)
vi.stubGlobal('recordDuration', () => 0)
vi.stubGlobal('getInstanceAtHead', async (key: ContentInstanceKey) => ({ navigation: async () => headNavs.get(key) ?? [] }))
vi.stubGlobal('findByPath', findByPath)

const { pullInstanceKeys, pullNavigation, pullPages, resolvePullPreview } = await import('../../server/utils/content/pull')

let number = 0
/** A fresh PR number per test: the preview cache is module state. */
const nextTarget = () => ({ repo: 'nuxt', number: ++number } as const)

function pull(overrides: Record<string, unknown> = {}) {
  return {
    title: 'docs: typo',
    html_url: 'https://github.com/nuxt/nuxt/pull/1',
    head: { sha: SHA, repo: { full_name: 'nuxt/nuxt' } },
    base: { ref: 'main' },
    labels: [],
    ...overrides
  }
}

function answer(body: unknown, files: unknown[] = []) {
  github.mockImplementation(url => url.endsWith('/files') ? files : body)
}

/** An ofetch `FetchError`, as far as `pull.ts` reads it. */
const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status })

beforeEach(() => {
  github.mockReset()
  pageStat.mockReset()
  pullNav.mockReset().mockReturnValue([])
  headNavs.clear()
})

describe('pullInstanceKeys', () => {
  it('maps a base branch to the instances reading it', () => {
    expect(pullInstanceKeys('nuxt/nuxt', 'main')).toEqual(['docs:5.x'])
    expect(pullInstanceKeys('nuxt/nuxt', '4.x')).toEqual(['docs:4.x'])
    expect(pullInstanceKeys('nuxt/cli', 'main')).toEqual(['cli:4.x', 'cli:5.x'])
    expect(pullInstanceKeys('nuxt/nuxt.com', 'main')).toEqual(['site'])
    expect(pullInstanceKeys('nuxt/nuxt', 'feat/x')).toEqual([])
  })
})

describe('resolvePullPreview', () => {
  it('previews a same-repo PR at its head commit', async () => {
    answer(pull(), [
      { filename: 'docs/1.getting-started/2.installation.md', status: 'modified' },
      { filename: 'docs/old.md', status: 'removed' }
    ])

    const preview = await resolvePullPreview(nextTarget())

    expect(preview).toMatchObject({ sha: SHA, keys: ['docs:5.x'], files: ['docs/1.getting-started/2.installation.md'] })
  })

  it('requires the preview label on a fork PR', async () => {
    answer(pull({ head: { sha: SHA, repo: { full_name: 'someone/nuxt' } } }))
    await expect(resolvePullPreview(nextTarget())).rejects.toMatchObject({ statusCode: 404 })

    answer(pull({ head: { sha: SHA, repo: null }, labels: [{ name: 'preview:enabled' }] }))
    await expect(resolvePullPreview(nextTarget())).resolves.toMatchObject({ sha: SHA })
  })

  it('caches a denial, so an unknown PR costs one GitHub call', async () => {
    const target = nextTarget()
    github.mockRejectedValue(httpError(404))

    await expect(resolvePullPreview(target)).rejects.toMatchObject({ statusCode: 404 })
    await expect(resolvePullPreview(target)).rejects.toMatchObject({ statusCode: 404 })
    expect(github).toHaveBeenCalledTimes(1)
  })

  it('denies a PR against a branch no instance reads', async () => {
    answer(pull({ base: { ref: 'feat/x' } }))

    await expect(resolvePullPreview(nextTarget())).rejects.toMatchObject({ statusCode: 404 })
  })

  it('retries after an outage instead of caching it', async () => {
    const target = nextTarget()
    github.mockRejectedValueOnce(httpError(403))
    await expect(resolvePullPreview(target)).rejects.toMatchObject({ statusCode: 502, statusMessage: 'Could not reach GitHub' })

    answer(pull())
    await expect(resolvePullPreview(target)).resolves.toMatchObject({ sha: SHA })
  })
})

describe('pullPages', () => {
  it('maps changed files to the pages of the first instance', async () => {
    pageStat.mockImplementation((key: string) => key === '1.getting-started/2.installation.md'
      ? { path: '/docs/5.x/getting-started/installation', data: { title: 'Installation' } }
      : undefined)

    const pages = await pullPages({
      target: { repo: 'nuxt', number: 1 },
      title: '',
      url: '',
      sha: SHA,
      keys: ['docs:5.x'],
      files: ['docs/1.getting-started/2.installation.md', 'docs/README.md', 'packages/nuxt/src/index.ts']
    })

    expect(pages).toEqual([{ title: 'Installation', path: '/docs/5.x/getting-started/installation' }])
  })
})

describe('pullNavigation', () => {
  const nav = (path: string, children?: NavigationItem[]) => ({ title: path, path, ...(children ? { children } : {}) }) as NavigationItem

  it('reads the PR\'s instances and grafts the others like production', async () => {
    pullNav.mockReturnValue([nav('/docs/4.x', [
      nav('/docs/4.x/getting-started'),
      nav('/docs/4.x/api', [nav('/docs/4.x/api/utils'), nav('/docs/4.x/api/kit')]),
      nav('/docs/4.x/new-section')
    ])])
    headNavs.set('cli:4.x', [nav('/docs/4.x/api/commands')])
    headNavs.set('examples', [nav('/docs/examples')])
    headNavs.set('site', [nav('/blog')])

    const tree = await pullNavigation('4.x', {
      target: { repo: 'nuxt', number: 1 },
      title: '',
      url: '',
      sha: SHA,
      keys: ['docs:4.x'],
      files: []
    })

    expect(tree.map(item => item.path)).toEqual(['/docs/4.x', '/blog'])
    expect(tree[0]!.children!.map(item => item.path)).toEqual([
      '/docs/4.x/getting-started',
      '/docs/4.x/api',
      '/docs/examples',
      '/docs/4.x/new-section'
    ])
    expect(tree[0]!.children![1]!.children!.map(item => item.path)).toEqual([
      '/docs/4.x/api/utils',
      '/docs/4.x/api/commands',
      '/docs/4.x/api/kit'
    ])
  })
})
