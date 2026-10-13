import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import fs from 'comark-content/sources/fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBuildInstance } from '../../utils/factory'
import { SECURITY_OPTIONS, sanitizePlugin } from '../../server/utils/content/plugins'
import { stripUnsafeData } from '../../server/utils/content/plugins/sanitize-data'

/** Strip `data` with the chain's policy, returning what's left and what went. */
function strip<T>(data: T) {
  const removed = stripUnsafeData(data, SECURITY_OPTIONS)
  return { data, removed }
}

describe('stripUnsafeData', () => {
  it('applies comark\'s rules at any depth', () => {
    expect(strip({
      'title': 'Page',
      'innerHTML': '<b>x</b>',
      '^onclick': 'x()',
      'links': [{ label: 'Docs', labelHtml: '<b>x</b>', to: 'javascript:void(0)' }],
      'hero': { as: 'script', card: { is: 'object' } }
    })).toEqual({
      data: { title: 'Page', links: [{ label: 'Docs' }], hero: { card: {} } },
      removed: ['innerHTML', '^onclick', 'links.0.labelHtml', 'links.0.to', 'hero.as', 'hero.card.is']
    })
  })

  it('drops script URLs under any key, which comark leaves to URL keys', () => {
    expect(strip({ template: { demo: 'javascript:void(0)', repo: 'nuxt/starter' }, provider: { website: 'data:text/html,x' } }))
      .toEqual({
        data: { template: { repo: 'nuxt/starter' }, provider: {} },
        removed: ['template.demo', 'provider.website']
      })
  })

  it('keeps every URL a page links to', () => {
    const links = [
      { to: '/docs/4.x/getting-started' },
      { to: '#usage' },
      { to: 'https://github.com/nuxt/nuxt' },
      { href: 'mailto:hello@nuxt.com' },
      { src: '/assets/blog/cover.png' },
      { website: 'https://vercel.com' }
    ]

    expect(strip({ links: structuredClone(links) })).toEqual({ data: { links }, removed: [] })
  })

  it('drops prose opening with a script scheme, the price of checking every key', () => {
    expect(strip({ title: 'JavaScript: the good parts', description: 'Use javascript:void(0) sparingly' }))
      .toEqual({ data: { description: 'Use javascript:void(0) sparingly' }, removed: ['title'] })
  })

  it('closes the hole a dropped array item leaves', () => {
    const { data, removed } = strip({ tags: ['nuxt', 'javascript:void(0)', 'vue'] })

    expect(data.tags).toEqual(['nuxt', 'vue'])
    expect(removed).toEqual(['tags.1'])
  })

  it('walks a shared or nested object once', () => {
    const template: Record<string, unknown> = { title: 'Starter', demo: 'javascript:void(0)' }
    template.self = template

    expect(strip({ templates: [template, template] }).removed).toEqual(['templates.0.demo'])
  })

  it('leaves scalars and safe data untouched', () => {
    const page = { title: 'Installation', navigation: { icon: 'i-lucide-play' }, links: [{ label: 'Source', to: 'https://github.com/nuxt/nuxt', icon: 'i-simple-icons-github' }], date: new Date(0) }

    expect(strip(structuredClone(page))).toEqual({ data: page, removed: [] })
    expect(strip('hello')).toEqual({ data: 'hello', removed: [] })
    expect(strip(null)).toEqual({ data: null, removed: [] })
  })
})

describe('sanitizePlugin', () => {
  function setupPlugin() {
    let onParsed: ((ctx: any) => void) | undefined
    sanitizePlugin.setup!({
      logger: { warn: vi.fn() },
      hooks: { hook: (name: string, fn: (ctx: any) => void) => void (name === 'file:parsed' && (onParsed = fn)) }
    } as never)

    return (ctx: any) => onParsed!(ctx)
  }

  it('strips a parsed file\'s data', () => {
    const fireFileParsed = setupPlugin()
    const file = { data: { title: 'Page', innerHTML: '<b>x</b>' }, meta: { key: 'docs/1.page.md' } }

    fireFileParsed({ file })
    expect(file.data).toEqual({ title: 'Page' })
  })

  it('ignores a rejected parse', () => {
    const fireFileParsed = setupPlugin()

    expect(() => fireFileParsed({ file: null })).not.toThrow()
  })
})

describe('sanitizePlugin in the instance chain', () => {
  let dir: string | undefined

  beforeEach(() => {
    // comark's `security()` warns about each frontmatter key it removes.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    if (dir) await rm(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('runs after the other plugins, on the data a page reads', async () => {
    dir = await mkdtemp(join(tmpdir(), 'nuxt-sanitize-'))
    // A dotted key only becomes `navigation.onclick` once `dottedFrontmatter()` has run.
    await writeFile(join(dir, '1.page.md'), [
      '---',
      'title: Page',
      'innerHTML: "<b>x</b>"',
      'navigation.onclick: "x()"',
      'links:',
      '  - label: Docs',
      '    to: "javascript:void(0)"',
      '---',
      '',
      '# Page',
      ''
    ].join('\n'))

    const content = createBuildInstance('docs:5.x', { source: fs(dir, { prefix: '/docs/5.x' }) })
    const page = await content.get('/docs/5.x/page')

    expect(page?.data).toEqual({ title: 'Page', navigation: {}, links: [{ label: 'Docs' }] })
    await content.dispose()
  })

  it('sanitizes YAML files, which never go through comark', async () => {
    dir = await mkdtemp(join(tmpdir(), 'nuxt-sanitize-'))
    await writeFile(join(dir, 'index.yml'), [
      'title: Home',
      'hero:',
      '  links:',
      '    - label: Docs',
      '      to: "javascript:void(0)"',
      '      "^onclick": "x()"',
      '  as: script',
      ''
    ].join('\n'))

    const content = createBuildInstance('site', { source: fs(dir, { prefix: '/' }) })
    const page = await content.get('/')

    expect(page?.data).toEqual({ title: 'Home', hero: { links: [{ label: 'Docs' }] } })
    await content.dispose()
  })
})
