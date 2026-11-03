import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ContentFile } from 'comark-content'
import fs from 'comark-content/sources/fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { createBundle } from '../../server/utils/l10n/bundle'
import { editorSegments } from '../../server/utils/l10n/editor'
import { createBuildInstance } from '../../utils/factory'

const FIXTURES = fileURLToPath(new URL('../fixtures/l10n/', import.meta.url))
const records = (JSON.parse(readFileSync(`${FIXTURES}fr.json`, 'utf8')) as { records: Record<string, Record<string, unknown>> }).records

/** `Nuxt is a free and {0}open-source framework{/0} with … {1}Vue.js{/1}.` */
const FIRST_PARAGRAPH = '839f9a4898b82644'
const PREVIOUS = '1'.repeat(16)

let page: ContentFile

beforeAll(async () => {
  const content = createBuildInstance('docs:4.x', { source: fs(`${FIXTURES}docs`, { prefix: '/docs/4.x' }) })
  await content.init({ partial: false })
  page = (await content.get('/docs/4.x/getting-started/introduction'))!
})

describe('editorSegments', () => {
  it('should list the translatable segments of a page with their records and glossary entries', async () => {
    const segments = await editorSegments(page, createBundle(records, 'fr', 'sha'), { terms: [{ term: 'Vue.js', decision: 'keep' }] })
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
    const bundle = createBundle({
      ...records,
      [FIRST_PARAGRAPH]: { ...records[FIRST_PARAGRAPH], derived: 'update', prev: PREVIOUS },
      [PREVIOUS]: { ...records[FIRST_PARAGRAPH], hash: PREVIOUS, source: 'Nuxt is a framework. It is free.' }
    }, 'fr', 'sha')
    const first = (await editorSegments(page, bundle, { terms: [] })).find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first.status).toBe('pending-review')
    expect(first.previous).toEqual({ source: 'Nuxt is a framework. It is free.', changed: [source] })
  })

  it('should not flag new sentences once a carried translation is reviewed', async () => {
    const bundle = createBundle({
      ...records,
      [FIRST_PARAGRAPH]: { ...records[FIRST_PARAGRAPH], derived: 'update', prev: PREVIOUS, review: 'verified', verifiedBy: { by: 'danielroe', at: '2026-11-03T00:00:00Z' } },
      [PREVIOUS]: { ...records[FIRST_PARAGRAPH], hash: PREVIOUS, source: 'Nuxt is a framework. It is free.' }
    }, 'fr', 'sha')
    const first = (await editorSegments(page, bundle, { terms: [] })).find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first.status).toBe('verified')
    expect(first.previous).toBeUndefined()
  })

  it('should show who rejected a translation', async () => {
    const bundle = createBundle({ ...records, [FIRST_PARAGRAPH]: { ...records[FIRST_PARAGRAPH], review: 'rejected', rejectedBy: { by: 'danielroe', at: '2026-11-03T00:00:00Z' } } }, 'fr', 'sha')
    const first = (await editorSegments(page, bundle, { terms: [] })).find(segment => segment.hash === FIRST_PARAGRAPH)!
    expect(first.status).toBe('rejected')
    expect(first.record).toMatchObject({ review: 'rejected', rejectedBy: 'danielroe', text: records[FIRST_PARAGRAPH]!.text })
  })

  it('should list a segment without a record as untranslated', async () => {
    const segments = await editorSegments(page, createBundle({}, 'fr', 'sha'), { terms: [] })
    expect(segments.every(segment => segment.status === 'untranslated' && !segment.record)).toBe(true)
  })
})
