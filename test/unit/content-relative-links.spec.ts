import type { Node } from 'comark'
import { describe, expect, it, vi } from 'vitest'
import { relativeLinks } from '../../server/utils/content/plugins/relative-links'

const PREFIX = '/docs/4.x/api/module-builder'
const KEYS = ['index.md', '3.develop-and-publish.md', '5.typescript.md', 'upgrade-v2.md', 'cli/build-module/index.md', 'cli/build-module/1.options.md']

/** Runs `relativeLinks()`'s `file:parsed` hook over `nodes` on the page at `stem`, in a source listing `keys`. */
function setup(keys = KEYS, expensiveReads = false) {
  let onParsed: ((ctx: unknown) => Promise<void>) | undefined
  relativeLinks().setup!({ hooks: { hook: (_: string, fn: typeof onParsed) => (onParsed = fn) } } as never)
  const source = { keys: vi.fn(() => keys), getItem: () => '', expensiveReads }

  async function rewrite(stem: string, nodes: Node[]): Promise<Node[]> {
    await onParsed!({ source: { ...source, getItem: () => '' }, file: { path: `${PREFIX}/${stem}`, data: {}, meta: { key: `module_builder/${stem}.md`, stem, prefix: PREFIX }, nodes } })
    return nodes
  }

  return { source, rewrite }
}

const href = async (value: string, stem = 'upgrade-v2'): Promise<unknown> => {
  const [link] = await setup().rewrite(stem, [['a', { href: value }, 'link']])
  return (link as [string, Record<string, unknown>])[1].href
}

describe('relativeLinks', () => {
  it('points a link to a sibling Markdown file at its page, keeping the anchor', async () => {
    expect(await href('./5.typescript.md#module-code')).toBe(`${PREFIX}/typescript#module-code`)
    expect(await href('./3.develop-and-publish.md')).toBe(`${PREFIX}/develop-and-publish`)
    expect(await href('upgrade-v2.md#stub-builds', 'index')).toBe(`${PREFIX}/upgrade-v2#stub-builds`)
    expect(await href('./index.md#quick-start')).toBe(`${PREFIX}#quick-start`)
  })

  it('resolves against the page directory', async () => {
    expect(await href('./1.options.md', 'cli/build-module/index')).toBe(`${PREFIX}/cli/build-module/options`)
    expect(await href('./5.typescript.md', 'cli/build-module/index')).toBe('./5.typescript.md')
  })

  it('leaves links to files the source does not list as written', async () => {
    expect(await href('./8.missing.md#anchor')).toBe('./8.missing.md#anchor')
  })

  it('leaves absolute, root-relative, in-page and non-sibling links alone', async () => {
    for (const value of [
      'https://github.com/nuxt/module-builder/blob/main/docs/5.typescript.md',
      '/docs/guide/modules/module-builder/typescript#module-code',
      '#build-messages',
      '../README.md',
      './cli/build-module/index.md',
      './5.typescript.md?plain=1',
      './5.typescript.ts'
    ]) {
      expect(await href(value)).toBe(value)
    }
  })

  it('leaves code and component props alone', async () => {
    const nodes = await setup().rewrite('upgrade-v2', [
      ['p', {}, ['code', {}, './5.typescript.md']],
      ['read-more', { to: './5.typescript.md' }]
    ])
    expect(nodes).toEqual([
      ['p', {}, ['code', {}, './5.typescript.md']],
      ['read-more', { to: './5.typescript.md' }]
    ])
  })

  it('lists a remote source once, and a local source on each page with relative links', async () => {
    for (const [expensiveReads, calls] of [[true, 1], [false, 2]] as const) {
      const { source, rewrite } = setup(KEYS, expensiveReads)
      await rewrite('upgrade-v2', [['a', { href: './5.typescript.md' }]])
      await rewrite('index', [['a', { href: './upgrade-v2.md' }]])
      await rewrite('5.typescript', [['a', { href: '#module-code' }]])
      expect(source.keys).toHaveBeenCalledTimes(calls)
    }
  })
})
