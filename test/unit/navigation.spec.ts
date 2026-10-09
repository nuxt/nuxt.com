import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NavigationItem } from 'comark-content'
import type { ContentInstanceKey } from '../../shared/utils/content'
import { cliInstanceKey, docsInstanceKey } from '../../shared/utils/content'
import { docsPathPrefix, EXAMPLES_PATH_PREFIX } from '../../shared/utils/docs'

const VERSION = '4.x'

/** What each instance's `navigation()` resolves to, or the error it rejects with. */
const navigations = new Map<ContentInstanceKey, NavigationItem[] | Error>()

/**
 * `navigation.ts` and the route handler reach for these through Nitro's auto-imports.
 * Vitest has none, so they are stubbed on `globalThis` before the modules are loaded.
 */
vi.stubGlobal('getInstanceAtHead', async (key: ContentInstanceKey) => {
  const nav = navigations.get(key)
  if (nav instanceof Error) throw nav

  return { navigation: async () => nav ?? [] }
})

const navigationUtils = await import('../../server/utils/content/navigation')
const { blogTree, cliTree, docTree, examplesTree, findByPath } = navigationUtils

vi.stubGlobal('docTree', docTree)
vi.stubGlobal('examplesTree', examplesTree)
vi.stubGlobal('findByPath', findByPath)
vi.stubGlobal('blogTree', blogTree)
vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('getRouterParam', (event: Record<string, string>, name: string) => event[name])
vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) =>
  Object.assign(new Error(input.statusMessage), input))

const handler = (await import('../../server/api/navigation/[version].get')).default as unknown as
  (event: Record<string, string>) => Promise<NavigationItem[]>

const docsNav = [{
  title: 'Docs',
  path: docsPathPrefix(VERSION),
  stem: 'index',
  children: [
    { title: 'Getting Started', path: `${docsPathPrefix(VERSION)}/getting-started` },
    { title: 'API', path: `${docsPathPrefix(VERSION)}/api` }
  ]
}] as unknown as NavigationItem[]

const examplesNav = [{ title: 'Examples', path: EXAMPLES_PATH_PREFIX }] as unknown as NavigationItem[]
const siteNav = [{ title: 'Blog', path: '/blog' }] as unknown as NavigationItem[]

/** The paths grafted under the version root, in order. */
const childPaths = (tree: NavigationItem[]) =>
  tree.find(item => item.path === docsPathPrefix(VERSION))?.children?.map(child => child.path)

beforeEach(() => {
  navigations.clear()
  navigations.set(docsInstanceKey(VERSION), docsNav)
  navigations.set('examples', examplesNav)
  navigations.set('site', siteNav)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('examplesTree', () => {
  it('returns the examples subtree', async () => {
    expect(await examplesTree()).toEqual([{ title: 'Examples', path: EXAMPLES_PATH_PREFIX }])
  })

  it('degrades to nothing when the examples instance fails — one optional graft cannot 500 every version', async () => {
    navigations.set('examples', new Error('github is down'))

    expect(await examplesTree()).toEqual([])
  })

  it('degrades to nothing when the instance serves no examples root', async () => {
    navigations.set('examples', [])

    expect(await examplesTree()).toEqual([])
  })
})

describe('docTree', () => {
  it('grafts the examples in after the API docs', async () => {
    expect(childPaths(await docTree(VERSION, await examplesTree()))).toEqual([
      `${docsPathPrefix(VERSION)}/getting-started`,
      `${docsPathPrefix(VERSION)}/api`,
      EXAMPLES_PATH_PREFIX
    ])
  })

  it('rejects when the docs instance fails', async () => {
    navigations.set(docsInstanceKey(VERSION), new Error('github is down'))

    await expect(docTree(VERSION, [])).rejects.toThrow('github is down')
  })

  it('degrades to nothing when the cli instance fails', async () => {
    navigations.set(cliInstanceKey(VERSION), new Error('github is down'))

    await expect(cliTree(VERSION)).resolves.toEqual([])
    await expect(docTree(VERSION, [])).resolves.toHaveLength(1)
  })
})

describe('GET /api/navigation/:version', () => {
  it('serves the version tree with examples and blog grafted in, minus `stem`', async () => {
    const tree = await handler({ version: VERSION })

    expect(childPaths(tree)).toEqual([
      `${docsPathPrefix(VERSION)}/getting-started`,
      `${docsPathPrefix(VERSION)}/api`,
      EXAMPLES_PATH_PREFIX
    ])
    expect(tree.map(item => item.path)).toEqual([docsPathPrefix(VERSION), '/blog'])
    expect(tree[0]).not.toHaveProperty('stem')
  })

  it('404s an unknown version', async () => {
    await expect(handler({ version: 'nope' })).rejects.toMatchObject({ statusCode: 404 })
  })

  /**
   * `/api/navigation/**` is ISR-cached.
   * A docs failure swallowed into a 200 would pin an empty navigation across the CDN.
   */
  it('fails rather than serving a docs-less tree the CDN would cache', async () => {
    navigations.set(docsInstanceKey(VERSION), new Error('github is down'))

    await expect(handler({ version: VERSION })).rejects.toThrow('github is down')
  })

  it('still serves the docs tree when the optional grafts fail', async () => {
    navigations.set('examples', new Error('github is down'))
    navigations.set('site', new Error('github is down'))

    const tree = await handler({ version: VERSION })

    expect(tree.map(item => item.path)).toEqual([docsPathPrefix(VERSION)])
    expect(childPaths(tree)).toEqual([
      `${docsPathPrefix(VERSION)}/getting-started`,
      `${docsPathPrefix(VERSION)}/api`
    ])
  })
})
