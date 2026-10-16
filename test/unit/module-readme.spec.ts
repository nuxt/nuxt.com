import { createMarkdownParser } from 'comark'
import { describe, expect, it } from 'vitest'
import { readmeLocation, resolveReadmeUrls } from '../../server/utils/content/readme'

const parse = createMarkdownParser({})

/** Every `[tag, attribute, value]` that carries a URL, in document order. */
async function urls(markdown: string, repo: string, branch?: string) {
  const tree = resolveReadmeUrls(await parse(markdown), repo, branch)
  const found: [string, string, string][] = []
  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return
    const [tag, attrs, ...children] = node as [string, Record<string, unknown>, ...unknown[]]
    for (const key of ['href', 'src', 'srcset', 'poster']) {
      if (typeof attrs?.[key] === 'string') found.push([tag, key, attrs[key] as string])
    }
    children.forEach(walk)
  }
  tree.nodes.forEach(walk)
  return found
}

describe('readmeLocation', () => {
  it('reads the branch and package directory of a monorepo', () => {
    expect(readmeLocation('c15t/c15t#canary/packages/vue'))
      .toEqual({ owner: 'c15t', name: 'c15t', branch: 'canary', dir: 'packages/vue' })
  })

  it('falls back to the default branch at the repository root', () => {
    expect(readmeLocation('nuxt/image')).toEqual({ owner: 'nuxt', name: 'image', branch: 'HEAD', dir: '' })
  })
})

describe('resolveReadmeUrls', () => {
  it('resolves a monorepo banner that points outside the package', async () => {
    const markdown = [
      '<picture>',
      '  <source media="(prefers-color-scheme: dark)" srcset="../../docs/assets/banner-dark.png">',
      '  <img src="../../docs/assets/banner-light.png" alt="c15t">',
      '</picture>'
    ].join('\n')

    expect(await urls(markdown, 'c15t/c15t#canary/packages/vue')).toEqual([
      ['source', 'srcset', 'https://raw.githubusercontent.com/c15t/c15t/canary/docs/assets/banner-dark.png'],
      ['img', 'src', 'https://raw.githubusercontent.com/c15t/c15t/canary/docs/assets/banner-light.png']
    ])
  })

  it('links relative files to github.com and leaves absolute urls alone', async () => {
    const markdown = [
      '![logo](./logo.svg) [Contributing](CONTRIBUTING.md) [Docs](/docs/intro.md#setup)',
      '[Site](https://nuxt.com) [Top](#usage) [Mail](mailto:a@b.c) ![badge](https://img.shields.io/npm/v/x)'
    ].join('\n')

    expect(await urls(markdown, 'nuxt/image')).toEqual([
      ['img', 'src', 'https://raw.githubusercontent.com/nuxt/image/HEAD/logo.svg'],
      ['a', 'href', 'https://github.com/nuxt/image/blob/HEAD/CONTRIBUTING.md'],
      ['a', 'href', 'https://github.com/nuxt/image/blob/HEAD/docs/intro.md#setup'],
      ['a', 'href', 'https://nuxt.com'],
      ['a', 'href', '#usage'],
      ['a', 'href', 'mailto:a@b.c'],
      ['img', 'src', 'https://img.shields.io/npm/v/x']
    ])
  })

  it('prefers the given default branch over the one pinned in the repo', async () => {
    const markdown = '<img src=".github/assets/banner-light.png">'

    expect(await urls(markdown, 'nuxt/ui#dev', 'v4')).toEqual([
      ['img', 'src', 'https://raw.githubusercontent.com/nuxt/ui/v4/.github/assets/banner-light.png']
    ])
  })

  it('keeps the descriptors of every srcset candidate', async () => {
    const markdown = '<img srcset="./a.png 1x, ./b.png 2x" src="./a.png">'

    expect(await urls(markdown, 'owner/repo#main/packages/nuxt')).toEqual([
      ['img', 'src', 'https://raw.githubusercontent.com/owner/repo/main/packages/nuxt/a.png'],
      ['img', 'srcset', 'https://raw.githubusercontent.com/owner/repo/main/packages/nuxt/a.png 1x, https://raw.githubusercontent.com/owner/repo/main/packages/nuxt/b.png 2x']
    ])
  })
})
