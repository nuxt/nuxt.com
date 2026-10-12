import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import fs from 'comark-content/sources/fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBuildInstance } from '../../utils/factory'
import { BLOCKED_TAGS } from '../../server/utils/content/plugins'
import { sanitizeData, stripUnsafeData } from '../../server/utils/content/plugins/sanitize-data'

/** Strip `data` with the chain's tags, returning what's left and what went. */
function strip<T>(data: T) {
  const removed = stripUnsafeData(data, BLOCKED_TAGS)
  return { data, removed }
}

describe('stripUnsafeData', () => {
  it('drops keys that write markup, whatever their case or depth', () => {
    expect(strip({
      title: 'Page',
      innerHTML: '<b>x</b>',
      links: [{ label: 'Docs', TextContent: 'x' }],
      hero: { card: { outerHTML: '<b>x</b>', srcdoc: '<b>x</b>' } }
    })).toEqual({
      data: { title: 'Page', links: [{ label: 'Docs' }], hero: { card: {} } },
      removed: ['innerHTML', 'links.0.TextContent', 'hero.card.outerHTML', 'hero.card.srcdoc']
    })
  })

  it('drops event handler keys, lowercase or not', () => {
    expect(strip({ onclick: 'x()', onMouseOver: 'x()', links: [{ label: 'Docs', onfocus: 'x()' }] }))
      .toEqual({ data: { links: [{ label: 'Docs' }] }, removed: ['onclick', 'onMouseOver', 'links.0.onfocus'] })
  })

  it('drops script URLs in link and resource keys, however they are spelled', () => {
    const { data, removed } = strip({
      links: [
        { label: 'a', to: 'javascript:void(0)' },
        { label: 'b', href: ' JavaScript:void(0)' },
        { label: 'c', to: 'java\tscript:void(0)' },
        { 'label': 'd', 'xlink:href': 'vbscript:x' },
        { label: 'e', src: 'data:text/html,x' }
      ]
    })

    expect(data.links).toEqual([{ label: 'a' }, { label: 'b' }, { label: 'c' }, { label: 'd' }, { label: 'e' }])
    expect(removed).toEqual(['links.0.to', 'links.1.href', 'links.2.to', 'links.3.xlink:href', 'links.4.src'])
  })

  it('keeps every URL a page links to', () => {
    const links = [
      { to: '/docs/4.x/getting-started' },
      { to: '#usage' },
      { to: 'https://github.com/nuxt/nuxt' },
      { href: 'mailto:hello@nuxt.com' },
      { src: '/assets/blog/cover.png' },
      { src: 'https://avatars.githubusercontent.com/u/1?v=4' }
    ]

    expect(strip({ links: structuredClone(links) })).toEqual({ data: { links }, removed: [] })
  })

  it('only checks URLs under URL keys', () => {
    const data = { title: 'JavaScript: the good parts', description: 'javascript:void(0) is a no-op' }

    expect(strip(structuredClone(data))).toEqual({ data, removed: [] })
  })

  it('drops an `as` naming a blocked tag, keeping any other', () => {
    expect(strip({ hero: { as: 'SCRIPT' }, card: { as: 'object' }, section: { as: 'section' } }))
      .toEqual({ data: { hero: {}, card: {}, section: { as: 'section' } }, removed: ['hero.as', 'card.as'] })
  })

  it('walks a shared or nested object once', () => {
    const link: Record<string, unknown> = { label: 'Docs', onclick: 'x()' }
    link.self = link

    expect(strip({ links: [link, link] }).removed).toEqual(['links.0.onclick'])
  })

  it('leaves scalars and safe data untouched', () => {
    const page = { title: 'Installation', navigation: { icon: 'i-lucide-play' }, links: [{ label: 'Source', to: 'https://github.com/nuxt/nuxt', icon: 'i-simple-icons-github' }], date: new Date(0) }

    expect(strip(structuredClone(page))).toEqual({ data: page, removed: [] })
    expect(strip('hello')).toEqual({ data: 'hello', removed: [] })
    expect(strip(null)).toEqual({ data: null, removed: [] })
  })
})

describe('sanitizeData() plugin', () => {
  function setupPlugin() {
    let onParsed: ((ctx: any) => void) | undefined
    const warn = vi.fn()
    sanitizeData({ blockedTags: BLOCKED_TAGS }).setup!({
      logger: { warn },
      hooks: { hook: (name: string, fn: (ctx: any) => void) => void (name === 'file:parsed' && (onParsed = fn)) }
    } as never)

    return { warn, fireFileParsed: (ctx: any) => onParsed!(ctx) }
  }

  it('strips a parsed file\'s data and names what it removed', () => {
    const { warn, fireFileParsed } = setupPlugin()
    const file = { data: { title: 'Page', innerHTML: '<b>x</b>' }, meta: { key: 'docs/1.page.md' } }

    fireFileParsed({ file })

    expect(file.data).toEqual({ title: 'Page' })
    expect(warn).toHaveBeenCalledWith('sanitize-data', 'docs/1.page.md: removed unsafe `innerHTML`')
  })

  it('stays quiet on safe data, and ignores a rejected parse', () => {
    const { warn, fireFileParsed } = setupPlugin()

    fireFileParsed({ file: { data: { title: 'Page' }, meta: { key: 'docs/1.page.md' } } })
    expect(() => fireFileParsed({ file: null })).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('sanitizeData() in the instance chain', () => {
  let dir: string | undefined

  afterEach(async () => {
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

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const content = createBuildInstance('docs:5.x', { source: fs(dir, { prefix: '/docs/5.x' }) })
    const page = await content.get('/docs/5.x/page')

    expect(page?.data).toEqual({ title: 'Page', navigation: {}, links: [{ label: 'Docs' }] })
    expect(warn).toHaveBeenCalledWith('[comark-content@sanitize-data]', expect.stringContaining('`navigation.onclick`'))
    warn.mockRestore()
    await content.dispose()
  })
})
