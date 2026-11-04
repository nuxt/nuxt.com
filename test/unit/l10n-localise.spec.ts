import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ElementNode, Node } from 'comark'
import { textContent } from 'comark/utils'
import fs from 'comark-content/sources/fs'
import type { ContentFile } from 'comark-content'
import { beforeAll, describe, expect, it } from 'vitest'
import { createBundle, emptyBundle } from '../../server/utils/l10n/bundle'
import { localise, localiseLabel, localiseNavigation, segmentSource } from '../../server/utils/l10n/localise'
import { createBuildInstance } from '../../utils/factory'

const FIXTURES = fileURLToPath(new URL('../fixtures/l10n/', import.meta.url))
const raw = JSON.parse(readFileSync(`${FIXTURES}fr.json`, 'utf8')) as { version: number, locale: string, records: Record<string, Record<string, unknown>> }
const bundle = (records: Record<string, Record<string, unknown>> = {}) => createBundle(new Map(Object.entries({ ...raw.records, ...records })), 'fr', 'a'.repeat(40))

const INTRODUCTION = '/docs/4.x/getting-started/introduction'
const USE_FETCH = '/docs/4.x/api/composables/use-fetch'
/** `Nuxt is a free and {0}open-source framework{/0} with … {1}Vue.js{/1}.` */
const FIRST_PARAGRAPH = '839f9a4898b82644'
/** The `::tip` of the introduction: `If you want to play around with Nuxt in your browser, …` */
const TIP = 'baf35e0f2e2e1937'

const pages = new Map<string, ContentFile>()

beforeAll(async () => {
  const content = createBuildInstance('docs:4.x', { source: fs(`${FIXTURES}docs`, { prefix: '/docs/4.x' }) })
  await content.init({ partial: false })
  for (const path of [INTRODUCTION, USE_FETCH]) pages.set(path, (await content.get(path))!)
})

/** Every element of `nodes` carrying `data-l10n-hash`, by hash. */
function marked(nodes: Node[]): Map<string, ElementNode> {
  const found = new Map<string, ElementNode>()
  const visit = (node: Node) => {
    if (!Array.isArray(node) || typeof node[0] !== 'string') return
    const hash = (node[1] as Record<string, unknown>)['data-l10n-hash']
    if (typeof hash === 'string') found.set(hash, node as ElementNode)
    for (let i = 2; i < node.length; i++) visit(node[i] as Node)
  }
  nodes.forEach(visit)
  return found
}

const links = (node: Node): string[] => {
  if (!Array.isArray(node) || typeof node[0] !== 'string') return []
  const own = node[0] === 'a' ? [String((node[1] as Record<string, unknown>).href)] : []
  return [...own, ...node.slice(2).flatMap(child => links(child as Node))]
}

describe('localise', () => {
  it('should substitute translations and keep the protected spans of the source', async () => {
    const localised = await localise(pages.get(INTRODUCTION)!, bundle())
    const paragraph = marked(localised.nodes).get(FIRST_PARAGRAPH)!

    expect(textContent(paragraph)).toBe(textContent(['p', {}, raw.records[FIRST_PARAGRAPH]!.text.replace(/\{\/?\d+\}/g, '')]))
    expect(links(paragraph)).toEqual(['https://github.com/nuxt/nuxt', 'https://vuejs.org'])
    expect(paragraph[1]).toMatchObject({ 'data-l10n': 'machine', 'data-l10n-hash': FIRST_PARAGRAPH })
    expect(paragraph[1]).not.toHaveProperty('lang')
  })

  it('should wrap text inside a component to carry its provenance', async () => {
    const localised = await localise(pages.get(INTRODUCTION)!, bundle())
    const tip = marked(localised.nodes).get(TIP)!

    expect(tip[0]).toBe('span')
    expect(tip[1]).toMatchObject({ 'data-l10n': 'machine', 'data-l10n-hash': TIP })
    expect(links(tip)).toEqual(['/docs/4.x/getting-started/installation#play-online'])
  })

  it('should translate the frontmatter and relabel the table of contents', async () => {
    const page = pages.get(INTRODUCTION)!
    const localised = await localise(page, bundle())

    expect(localised.data.description).not.toBe(page.data.description)
    const toc = (localised.meta as { toc: { links: Array<{ id: string, text: string }> } }).toc.links
    expect(toc.find(link => link.id === 'automation-and-conventions')?.text).toBe('Automatisation et conventions')
    expect((page.meta as { toc: { links: Array<{ id: string, text: string }> } }).toc.links.find(link => link.id === 'automation-and-conventions')?.text).toBe('Automation and Conventions')
  })

  it('should fall back to the English segment when a translation fails validation', async () => {
    const page = pages.get(INTRODUCTION)!
    const broken = { ...raw.records[FIRST_PARAGRAPH], text: 'Nuxt est un framework gratuit avec [Vue.js](https://example.com).' }
    const localised = await localise(page, bundle({ [FIRST_PARAGRAPH]: broken }))
    const paragraph = marked(localised.nodes).get(FIRST_PARAGRAPH)!

    expect(paragraph[1]).toMatchObject({ 'data-l10n': 'rejected', 'lang': 'en' })
    expect(textContent(paragraph)).toBe(textContent(marked((await localise(page, emptyBundle('fr'))).nodes).get(FIRST_PARAGRAPH)!))
    expect(links(paragraph)).toEqual(['https://github.com/nuxt/nuxt', 'https://vuejs.org'])
    expect(localised.meta.l10n.coverage.byStatus.rejected).toBeGreaterThan(0)
  })

  it('should show the English segment of a translation a reviewer rejected', async () => {
    const page = pages.get(INTRODUCTION)!
    const rejected = { ...raw.records[FIRST_PARAGRAPH], review: 'rejected', rejectedBy: { by: 'danielroe', at: '2026-11-03T00:00:00Z' } }
    const localised = await localise(page, bundle({ [FIRST_PARAGRAPH]: rejected }))
    const paragraph = marked(localised.nodes).get(FIRST_PARAGRAPH)!

    expect(paragraph[1]).toMatchObject({ 'data-l10n': 'rejected', 'lang': 'en' })
    expect(textContent(paragraph)).toBe(textContent(marked((await localise(page, emptyBundle('fr'))).nodes).get(FIRST_PARAGRAPH)!))
    expect(localised.meta.l10n.coverage.byStatus.rejected).toBe(27)
  })

  it('should render every block in English from an empty bundle', async () => {
    const page = pages.get(INTRODUCTION)!
    const localised = await localise(page, emptyBundle('fr'))
    const blocks = [...marked(localised.nodes).values()]

    expect(blocks.length).toBeGreaterThan(5)
    expect(blocks.every(block => block[1].lang === 'en' && block[1]['data-l10n'] === 'untranslated')).toBe(true)
    expect(localised.data.title).toBe(page.data.title)
    expect(localised.meta.l10n).toMatchObject({ locale: 'fr', sha: '' })
    expect(localised.meta.l10n.coverage.byStatus).toEqual({ untranslated: localised.meta.l10n.coverage.words })
  })

  it('should translate code comments without touching the code', async () => {
    const page = pages.get(USE_FETCH)!
    const before = JSON.stringify(page.nodes)
    const localised = await localise(page, bundle())
    const code = (nodes: Node[]) => nodes.filter(node => Array.isArray(node) && node[0] === 'pre').map(node => textContent(node)).join('\n')

    expect(code(localised.nodes)).toContain('// Définir les en-têtes de la requête')
    expect(code(localised.nodes)).not.toContain('// Set the request headers')
    const withoutComments = (text: string) => text.replace(/\/\*\*?[^*]*\*\/|\/\/.*$/gm, '')
    expect(withoutComments(code(localised.nodes))).toBe(withoutComments(code(page.nodes)))
    expect(JSON.stringify(page.nodes)).toBe(before)
  })

  it('should count the words of the page by status', async () => {
    const { coverage } = (await localise(pages.get(USE_FETCH)!, bundle())).meta.l10n
    const counted = Object.values(coverage.byStatus).reduce((sum, words) => sum + (words ?? 0), 0)

    expect(counted).toBe(coverage.words)
    expect(coverage.byStatus.machine).toBeGreaterThan(coverage.words * 0.9)
  })
})

describe('segmentSource', () => {
  it('should return the English source and provenance of one segment', async () => {
    expect(await segmentSource(pages.get(INTRODUCTION)!, bundle(), FIRST_PARAGRAPH)).toEqual({
      hash: FIRST_PARAGRAPH,
      source: 'Nuxt is a free and [open-source framework](https://github.com/nuxt/nuxt) with an intuitive and extendable way to create type-safe, performant and production-grade full-stack web applications and websites with [Vue.js](https://vuejs.org).',
      status: 'machine',
      model: 'anthropic/claude-sonnet-5.5',
      updatedAt: raw.records[FIRST_PARAGRAPH]!.updatedAt
    })
    expect(await segmentSource(pages.get(INTRODUCTION)!, bundle(), '0'.repeat(16))).toBeUndefined()
  })
})

describe('localiseNavigation', () => {
  it('should translate the titles of localised pages and directories only', () => {
    const tree = localiseNavigation([
      { title: 'Docs', path: '/docs/4.x', children: [{ title: 'Get Started', path: '/docs/4.x/getting-started' }] },
      { title: 'Get Started', path: '/blog/get-started' }
    ], bundle())

    expect(tree[0]!.children![0]!.title).toBe('Premiers pas')
    expect(tree[1]!.title).toBe('Get Started')
  })

  it('should translate title templates, keeping their placeholder', () => {
    const tree = localiseNavigation([
      { title: 'Get Started', path: '/docs/4.x/getting-started', titleTemplate: '%s · Get Started with Nuxt' },
      { title: 'Get Started', path: '/blog/get-started', titleTemplate: '%s · Get Started with Nuxt' }
    ], bundle())

    expect(tree[0]!.titleTemplate).toBe('%s · Premiers pas avec Nuxt')
    expect(tree[1]!.titleTemplate).toBe('%s · Get Started with Nuxt')
    expect(localiseLabel('%s', bundle())).toBe('%s')
  })

  it('should keep a label without a valid translation', () => {
    expect(localiseLabel('Get Started', emptyBundle('fr'))).toBe('Get Started')
    expect(localiseLabel('No such label', bundle())).toBe('No such label')
  })

  it('should keep a label whose translation was rejected', () => {
    const hash = 'c778a5039e0ca98f'
    const rejected = bundle({ [hash]: { ...raw.records[hash], review: 'rejected', rejectedBy: { by: 'danielroe', at: '2026-11-02T00:00:00.000Z' } } })
    expect(localiseLabel('Get Started', rejected)).toBe('Get Started')
  })
})
