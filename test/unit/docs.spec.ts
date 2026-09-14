import type { Node } from 'comark'
import { describe, expect, it } from 'vitest'
import { docsLinks } from '../../server/utils/content/plugins/docs-links'
import type { DocVersion } from '../../shared/utils/docs'

/**
 * Runs the plugin's `file:parsed` hook against a hand-built tree.
 */
function rewrite(version: DocVersion, nodes: Node[], data: Record<string, unknown> = {}) {
  let parsed: (payload: { file: unknown }) => void
  const content = { hooks: { hook: (_name: string, fn: typeof parsed) => (parsed = fn) } }

  docsLinks(version).setup?.(content as never)
  parsed!({ file: { nodes, data, meta: { key: 'docs/x.md' } } })

  return { nodes, data }
}

describe('docsLinks', () => {
  it('versions a markdown link', () => {
    const { nodes } = rewrite('5.x', [['a', { href: '/docs/getting-started/introduction' }, 'intro']])
    expect(nodes[0]![1]).toEqual({ href: '/docs/5.x/getting-started/introduction' })
  })

  it('versions MDC component props, whatever they are named', () => {
    const { nodes } = rewrite('3.x', [
      ['read-more', { to: '/docs/api/composables/use-fetch' }],
      ['card', { link: '/docs/guide', title: 'Guide' }]
    ])
    expect(nodes[0]![1]).toEqual({ to: '/docs/3.x/api/composables/use-fetch' })
    expect(nodes[1]![1]).toEqual({ link: '/docs/3.x/guide', title: 'Guide' })
  })

  it('walks into arrays and objects a prop can hold', () => {
    const { nodes } = rewrite('4.x', [['card-group', { items: [{ to: '/docs/guide' }, { to: '/docs/api' }] }]])
    expect(nodes[0]![1]).toEqual({ items: [{ to: '/docs/4.x/guide' }, { to: '/docs/4.x/api' }] })
  })

  it('versions frontmatter paths, which `visit` does not reach', () => {
    const { data } = rewrite('4.x', [], { hero: { links: [{ to: '/docs/getting-started/installation' }] } })
    expect(data).toEqual({ hero: { links: [{ to: '/docs/4.x/getting-started/installation' }] } })
  })

  it('leaves already-versioned links alone', () => {
    const { nodes } = rewrite('5.x', [['a', { href: '/docs/3.x/guide' }], ['read-more', { to: '/docs/4.x/api' }]])
    expect(nodes[0]![1]).toEqual({ href: '/docs/3.x/guide' })
    expect(nodes[1]![1]).toEqual({ to: '/docs/4.x/api' })
  })

  it('does not touch asset paths, external docs URLs or prose', () => {
    const { nodes } = rewrite('5.x', [
      ['img', { src: '/assets/docs/guide/rendering.svg' }],
      ['a', { href: 'https://developer.mozilla.org/en-US/docs/Web/API/fetch' }],
      'use relative paths without the domain: /docs/getting-started/installation'
    ])
    expect(nodes[0]![1]).toEqual({ src: '/assets/docs/guide/rendering.svg' })
    expect(nodes[1]![1]).toEqual({ href: 'https://developer.mozilla.org/en-US/docs/Web/API/fetch' })
    expect(nodes[2]).toBe('use relative paths without the domain: /docs/getting-started/installation')
  })

  it('does not touch a code sample that happens to be a docs path', () => {
    // The regression this guards: `main`'s raw-body regex rewrote inside fences, this must not.
    const { nodes } = rewrite('5.x', [['pre', { code: '/docs/getting-started/installation' }]])
    expect(nodes[0]![1]).toEqual({ code: '/docs/getting-started/installation' })
  })

  it('leaves comark node metadata alone', () => {
    const { nodes } = rewrite('4.x', [['a', { $: { line: 12 }, href: '/docs/guide' }]])
    expect(nodes[0]![1]).toEqual({ $: { line: 12 }, href: '/docs/4.x/guide' })
  })

  it('retargets the pages that moved to 5.x, and only those', () => {
    const { nodes } = rewrite('5.x', [
      ['a', { href: '/docs/4.x/guide/modules/module-dependencies' }],
      // Dropped in 5.x, so the 4.x link is the correct one to keep.
      ['a', { href: '/docs/4.x/guide/concepts/esm' }]
    ])
    expect(nodes[0]![1]).toEqual({ href: '/docs/5.x/guide/modules/module-dependencies' })
    expect(nodes[1]![1]).toEqual({ href: '/docs/4.x/guide/concepts/esm' })
  })
})
