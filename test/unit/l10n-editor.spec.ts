import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ContentFile } from 'comark-content'
import fs from 'comark-content/sources/fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { createBundle } from '../../server/utils/l10n/bundle'
import { editorSegments } from '../../server/utils/l10n/editor'
import { createBuildInstance } from '../../utils/factory'
import { hasL10nBlock, otherTextGroups } from '../../shared/utils/l10n'

const FIXTURES = fileURLToPath(new URL('../fixtures/l10n/', import.meta.url))
const records = (JSON.parse(readFileSync(`${FIXTURES}fr.json`, 'utf8')) as { records: Record<string, Record<string, unknown>> }).records

/** `Nuxt is a free and {0}open-source framework{/0} with … {1}Vue.js{/1}.` */
const FIRST_PARAGRAPH = '839f9a4898b82644'
const PREVIOUS = '1'.repeat(16)

const bundleOf = (value: Record<string, unknown>) => createBundle(new Map(Object.entries(value)), 'fr', 'sha')

let page: ContentFile
let useFetch: ContentFile

beforeAll(async () => {
  const content = createBuildInstance('docs:4.x', { source: fs(`${FIXTURES}docs`, { prefix: '/docs/4.x' }) })
  await content.init({ partial: false })
  page = (await content.get('/docs/4.x/getting-started/introduction'))!
  useFetch = (await content.get('/docs/4.x/api/composables/use-fetch'))!
})

describe('editorSegments', () => {
  it('should list the translatable segments of a page with their records and glossary entries', async () => {
    const segments = await editorSegments(page, bundleOf(records), { terms: [{ term: 'Vue.js', decision: 'keep' }] })
    expect(segments.every(segment => segment.words > 0)).toBe(true)

    const first = segments.find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first).toMatchObject({
      kind: 'paragraph',
      format: 'markdown',
      status: 'machine',
      record: { text: records[FIRST_PARAGRAPH]!.text, origin: 'mt', review: 'none', model: 'anthropic/claude-sonnet-5.5' },
      glossary: [{ term: 'Vue.js', decision: 'keep' }]
    })
    expect(first.placeholders.map(placeholder => placeholder.type)).toEqual(['link', 'link'])
    expect(first.previous).toBeUndefined()
  })

  it('should show the sentences that are new since the source a record was carried from', async () => {
    const source = records[FIRST_PARAGRAPH]!.source as string
    const bundle = bundleOf({
      ...records,
      [FIRST_PARAGRAPH]: { ...records[FIRST_PARAGRAPH], derived: 'update', prev: PREVIOUS },
      [PREVIOUS]: { ...records[FIRST_PARAGRAPH], hash: PREVIOUS, source: 'Nuxt is a framework. It is free.' }
    })
    const first = (await editorSegments(page, bundle, { terms: [] })).find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first.status).toBe('pending-review')
    expect(first.previous).toEqual({ source: 'Nuxt is a framework. It is free.', changed: [source] })
  })

  it('should not flag new sentences once a carried translation is reviewed', async () => {
    const bundle = bundleOf({
      ...records,
      [FIRST_PARAGRAPH]: { ...records[FIRST_PARAGRAPH], derived: 'update', prev: PREVIOUS, review: 'verified', verifiedBy: { by: 'danielroe', at: '2026-11-03T00:00:00Z' } },
      [PREVIOUS]: { ...records[FIRST_PARAGRAPH], hash: PREVIOUS, source: 'Nuxt is a framework. It is free.' }
    })
    const first = (await editorSegments(page, bundle, { terms: [] })).find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first.status).toBe('verified')
    expect(first.previous).toBeUndefined()
  })

  it('should show who rejected a translation', async () => {
    const bundle = bundleOf({ ...records, [FIRST_PARAGRAPH]: { ...records[FIRST_PARAGRAPH], review: 'rejected', rejectedBy: { by: 'danielroe', at: '2026-11-03T00:00:00Z' } } })
    const first = (await editorSegments(page, bundle, { terms: [] })).find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first.status).toBe('rejected')
    expect(first.record).toMatchObject({ review: 'rejected', rejectedBy: 'danielroe', text: records[FIRST_PARAGRAPH]!.text })
  })

  it('should list a segment without a record as untranslated', async () => {
    const segments = await editorSegments(page, bundleOf({}), { terms: [] })
    expect(segments.every(segment => segment.status === 'untranslated' && !segment.record)).toBe(true)
  })
})

describe('otherTextGroups', () => {
  it('should group the segments without a block under their nearest heading, frontmatter first', async () => {
    const segments = await editorSegments(page, bundleOf(records), { terms: [] })
    const groups = otherTextGroups(segments)

    expect(groups.map(group => [group.type, group.heading, group.segments.map(segment => `${segment.kind}:${segment.skeleton}`)])).toEqual([
      ['meta', undefined, ['frontmatter:Introduction', `frontmatter:${page.data!.description}`]],
      ['section', 'Server-Side Rendering', ['prop:Nuxt rendering modes']],
      ['section', 'Server engine', ['prop:Nuxt server engine']],
      ['section', 'Production-ready', ['prop:Deployment section']],
      ['section', 'Modular', ['prop:Nuxt Modules Concept']]
    ])
    const heading = segments.find(segment => segment.kind === 'heading' && segment.skeleton === 'Server-Side Rendering')!
    expect(groups[1]!.headingHash).toBe(heading.hash)
    expect(groups.flatMap(group => group.segments).every(segment => !hasL10nBlock(segment))).toBe(true)
    expect(segments.filter(segment => !hasL10nBlock(segment))).toHaveLength(6)
  })

  it('should list code comments and labels, and texts before the first heading', async () => {
    const segments = await editorSegments(useFetch, bundleOf({}), { terms: [] })
    const groups = otherTextGroups(segments)

    expect(groups[0]).toMatchObject({ type: 'meta' })
    expect(groups[0]!.segments.map(segment => segment.context.detail)).toEqual(['title', 'description', 'links.0.label'])
    const usage = groups.find(group => group.heading === 'Usage')!
    expect(usage.segments.map(segment => [segment.kind, segment.context.detail])).toEqual(Array.from({ length: 5 }, () => ['code-comment', 'ts']))
    expect(groups.find(group => group.heading === 'Type')!.segments.map(segment => segment.kind)).toEqual(['code-label', 'code-comment'])
    expect(groups.find(group => group.heading === 'Reactive Keys and Shared State')!.segments.map(segment => `${segment.kind}:${segment.context.containers.join('/')}`))
      .toEqual(['code-comment:', 'code-comment:code-group', 'code-comment:code-group', 'prop:video-accordion'])
  })
})
