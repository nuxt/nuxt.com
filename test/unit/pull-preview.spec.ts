import { createError } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import memoryDriver from 'unstorage/drivers/memory'
import type { NavigationItem } from 'comark-content'
import { instanceSource } from '../../server/utils/content/instances'
import { findByPath } from '../../server/utils/content/navigation'
import type { ContentInstanceKey } from '../../shared/utils/content'

const SHA = 'a'.repeat(40)
const NEXT_SHA = 'b'.repeat(40)

/** GitHub's answers, by URL and page. */
const github = vi.fn<(url: string, page?: number) => unknown>()

/** `pull.ts` reaches for these through Nitro's auto-imports. */
vi.stubGlobal('createError', createError)
vi.stubGlobal('githubRefCacheDriver', () => memoryDriver())
vi.stubGlobal('contentGithubToken', () => 'tok')
vi.stubGlobal('instanceSource', instanceSource)
vi.stubGlobal('$fetch', vi.fn(async (url: string, options?: { query?: { page?: number } }) => github(url, options?.query?.page)))

/** What the PR's pinned instance answers, and production's entries and navigation per instance. */
const pageStat = vi.fn()
const headStat = vi.fn()
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
vi.stubGlobal('getInstanceAtHead', async (key: ContentInstanceKey) => ({ stat: headStat, navigation: async () => headNavs.get(key) ?? [] }))
vi.stubGlobal('findByPath', findByPath)

type PullModule = typeof import('../../server/utils/content/pull')
let { pullInstanceKey, pullLandingPath, pullNavigation, pullPages, resolvePullPreview } = {} as PullModule

/** Files a PR modifies or adds. */
const changed = (...paths: string[]) => paths.map(path => ({ path, removed: false }))

const target = (number: number) => ({ repo: 'nuxt', number } as const)

function pull(number: number, overrides: Record<string, unknown> = {}) {
  return {
    number,
    title: 'docs: typo',
    html_url: `https://github.com/nuxt/nuxt/pull/${number}`,
    head: { sha: SHA, repo: { full_name: 'nuxt/nuxt' } },
    base: { ref: 'main' },
    labels: [{ name: 'preview:enabled' }],
    ...overrides
  }
}

const DOCS_FILE = { filename: 'docs/1.getting-started/2.installation.md', status: 'modified' }

/** GitHub lists `pulls` as open, each changing `files`. */
function answer(pulls: unknown[], files: unknown[] = [DOCS_FILE]) {
  github.mockImplementation(url => url.endsWith('/files') ? files : pulls)
}

const calls = (suffix: string) => github.mock.calls.filter(([url]) => url.endsWith(suffix)).length

/** An ofetch `FetchError`, as far as `pull.ts` reads it. */
const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status })

beforeEach(async () => {
  github.mockReset()
  pageStat.mockReset()
  headStat.mockReset()
  pullNav.mockReset().mockReturnValue([])
  headNavs.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(0)

  // The open PR list is module state: start each test from an empty cache.
  vi.resetModules()
  ;({ pullInstanceKey, pullLandingPath, pullNavigation, pullPages, resolvePullPreview } = await import('../../server/utils/content/pull'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('pullInstanceKey', () => {
  it('maps a base branch to the instance reading it', () => {
    expect(pullInstanceKey('nuxt/nuxt', 'main')).toBe('docs:5.x')
    expect(pullInstanceKey('nuxt/nuxt', '4.x')).toBe('docs:4.x')
    expect(pullInstanceKey('nuxt/nuxt.com', 'main')).toBe('site')
    expect(pullInstanceKey('nuxt/nuxt', 'feat/x')).toBeUndefined()
  })

  it('picks the current version when several read the branch', () => {
    expect(pullInstanceKey('nuxt/cli', 'main')).toBe('cli:4.x')
  })
})

describe('resolvePullPreview', () => {
  it('previews an open labelled PR at its head commit', async () => {
    answer([pull(1)], [DOCS_FILE, { filename: 'packages/nuxt/src/index.ts', status: 'modified' }])

    const preview = await resolvePullPreview(target(1))

    expect(preview).toMatchObject({
      sha: SHA,
      instanceKey: 'docs:5.x',
      files: changed('docs/1.getting-started/2.installation.md', 'packages/nuxt/src/index.ts')
    })
  })

  it('denies a PR that changes no content, counting removals as changes', async () => {
    answer([pull(1)], [{ filename: 'packages/nuxt/src/index.ts', status: 'modified' }])
    await expect(resolvePullPreview(target(1))).rejects.toMatchObject({ statusCode: 404 })

    vi.resetModules()
    ;({ resolvePullPreview } = await import('../../server/utils/content/pull'))
    answer([pull(1)], [{ filename: 'docs/old.md', status: 'removed' }])
    await expect(resolvePullPreview(target(1))).resolves.toMatchObject({ files: [{ path: 'docs/old.md', removed: true }] })
  })

  it('reads every page of changed files, so a large PR\'s content isn\'t missed', async () => {
    const code = Array.from({ length: 100 }, (_, index) => ({ filename: `packages/nuxt/src/${index}.ts` }))
    github.mockImplementation((url, page) => url.endsWith('/files') ? (page === 1 ? code : [DOCS_FILE]) : [pull(1)])

    await expect(resolvePullPreview(target(1))).resolves.toMatchObject({ sha: SHA })
    expect(calls('/files')).toBe(2)
  })

  it('requires the preview label, same-repo PRs included', async () => {
    answer([
      pull(1, { labels: [] }),
      pull(2, { head: { sha: SHA, repo: null } })
    ])

    await expect(resolvePullPreview(target(1))).rejects.toMatchObject({ statusCode: 404 })
    await expect(resolvePullPreview(target(2))).resolves.toMatchObject({ sha: SHA })
  })

  it('denies a PR against a branch no instance reads', async () => {
    answer([pull(1, { base: { ref: 'feat/x' } })])

    await expect(resolvePullPreview(target(1))).rejects.toMatchObject({ statusCode: 404 })
  })

  it('answers closed and unknown numbers from the cached list, without refreshing it', async () => {
    answer([pull(5)])

    await expect(resolvePullPreview(target(5))).resolves.toMatchObject({ sha: SHA })
    // Closed, merged or never a PR: not open, so nothing can have changed.
    vi.setSystemTime(61_000)
    await expect(resolvePullPreview(target(3))).rejects.toMatchObject({ statusCode: 404 })
    await expect(resolvePullPreview(target(5))).resolves.toMatchObject({ sha: SHA })

    expect(calls('/pulls')).toBe(1)
    expect(calls('/files')).toBe(1)
  })

  it('refreshes the list for a number above every listed PR, at most every minute', async () => {
    answer([pull(5)])
    await resolvePullPreview(target(5))

    answer([pull(5), pull(6)])
    await expect(resolvePullPreview(target(6))).rejects.toMatchObject({ statusCode: 404 })

    vi.setSystemTime(61_000)
    await expect(resolvePullPreview(target(6))).resolves.toMatchObject({ sha: SHA })
    await expect(resolvePullPreview(target(999))).rejects.toMatchObject({ statusCode: 404 })

    expect(calls('/pulls')).toBe(2)
  })

  it('picks up a label added since, at most every minute', async () => {
    answer([pull(5, { labels: [] })])
    await expect(resolvePullPreview(target(5))).rejects.toMatchObject({ statusCode: 404 })

    answer([pull(5)])
    await expect(resolvePullPreview(target(5))).rejects.toMatchObject({ statusCode: 404 })

    vi.setSystemTime(61_000)
    await expect(resolvePullPreview(target(5))).resolves.toMatchObject({ sha: SHA })

    expect(calls('/pulls')).toBe(2)
  })

  it('follows new pushes once the list expires', async () => {
    answer([pull(5)])
    await resolvePullPreview(target(5))

    answer([pull(5, { head: { sha: NEXT_SHA, repo: { full_name: 'nuxt/nuxt' } } })])
    vi.setSystemTime(601_000)

    await expect(resolvePullPreview(target(5))).resolves.toMatchObject({ sha: NEXT_SHA })
    expect(calls('/files')).toBe(2)
  })

  it('shares one list fetch between concurrent requests', async () => {
    answer([pull(1), pull(2)])

    await Promise.all([resolvePullPreview(target(1)), resolvePullPreview(target(2)), resolvePullPreview(target(1))])

    expect(calls('/pulls')).toBe(1)
  })

  it('retries after an outage instead of caching it', async () => {
    github.mockRejectedValueOnce(httpError(403))
    await expect(resolvePullPreview(target(1))).rejects.toMatchObject({ statusCode: 502, statusMessage: 'Could not reach GitHub' })

    answer([pull(1)])
    await expect(resolvePullPreview(target(1))).resolves.toMatchObject({ sha: SHA })
  })
})

describe('pullPages', () => {
  it('maps changed files to the pages of the instance it replaces', async () => {
    pageStat.mockImplementation((key: string) => key === '1.getting-started/2.installation.md'
      ? { path: '/docs/5.x/getting-started/installation', data: { title: 'Installation' } }
      : undefined)

    const pages = await pullPages({
      target: { repo: 'nuxt', number: 1 },
      title: '',
      url: '',
      sha: SHA,
      instanceKey: 'docs:5.x',
      files: changed('docs/1.getting-started/2.installation.md', 'docs/README.md', 'packages/nuxt/src/index.ts')
    })

    expect(pages).toEqual([{ title: 'Installation', path: '/docs/5.x/getting-started/installation', removed: false }])
  })

  it('reads a removed page from production, flagged as removed', async () => {
    headStat.mockImplementation((key: string) => key === '1.getting-started/9.old.md'
      ? { path: '/docs/5.x/getting-started/old', data: { title: 'Old page' } }
      : undefined)

    const pages = await pullPages({
      target: { repo: 'nuxt', number: 1 },
      title: '',
      url: '',
      sha: SHA,
      instanceKey: 'docs:5.x',
      files: [{ path: 'docs/1.getting-started/9.old.md', removed: true }]
    })

    expect(pageStat).not.toHaveBeenCalled()
    expect(pages).toEqual([{ title: 'Old page', path: '/docs/5.x/getting-started/old', removed: true }])
  })

  it('links a data entry to the page showing it, and drops entries no page shows', async () => {
    const entries: Record<string, { path: string, data: { title: string } }> = {
      'templates/agency-os.yml': { path: '/templates/agency-os', data: { title: 'Agency OS' } },
      'design.md': { path: '/design', data: { title: 'Design' } },
      'blog/v4.md': { path: '/blog/v4', data: { title: 'Nuxt 4' } }
    }
    pageStat.mockImplementation((key: string) => entries[key])

    const pages = await pullPages({
      target: { repo: 'nuxt.com', number: 1 },
      title: '',
      url: '',
      sha: SHA,
      instanceKey: 'site',
      files: changed('content/templates/agency-os.yml', 'content/design.md', 'content/blog/v4.md')
    })

    expect(pages).toEqual([
      { title: 'Agency OS', path: '/templates', removed: false },
      { title: 'Nuxt 4', path: '/blog/v4', removed: false }
    ])
  })
})

describe('pullLandingPath', () => {
  it('lands on the first changed page the PR still has', async () => {
    headStat.mockReturnValue({ path: '/docs/5.x/getting-started/old', data: { title: 'Old page' } })
    pageStat.mockReturnValue({ path: '/docs/5.x/getting-started/installation', data: { title: 'Installation' } })

    const path = await pullLandingPath({
      target: { repo: 'nuxt', number: 1 },
      title: '',
      url: '',
      sha: SHA,
      instanceKey: 'docs:5.x',
      files: [{ path: 'docs/1.getting-started/9.old.md', removed: true }, ...changed('docs/1.getting-started/2.installation.md')]
    })

    expect(path).toBe('/docs/5.x/getting-started/installation')
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
      instanceKey: 'docs:4.x',
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
