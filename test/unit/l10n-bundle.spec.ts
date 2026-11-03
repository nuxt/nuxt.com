import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createBundle, emptyBundle } from '../../server/utils/l10n/bundle'
import { coverageTable, fileCoverage, sourceCoverage, TRANSLATION_SOURCES, type SourceManifest } from '../../server/utils/l10n/coverage'
import { visibleRecord } from '../../server/utils/l10n/localise'
import { changedHashes, isTranslationsPush, rebuiltLocales } from '../../server/utils/l10n/webhook'
import { instanceSource } from '../../server/utils/content/instances'
import { isIndexableCoverage, reviewedShare } from '../../shared/utils/l10n'

const fixture = (file: string) => JSON.parse(readFileSync(new URL(`../fixtures/l10n/${file}`, import.meta.url), 'utf8'))
const raw = fixture('fr.json') as { version: number, locale: string, records: Record<string, Record<string, unknown>> }
const manifest = fixture('manifest.json') as SourceManifest
const INTRODUCTION = 'docs/1.getting-started/01.introduction.md'

/** The fixture bundle with some records replaced. */
function bundleWith(records: Record<string, Record<string, unknown> | undefined> = {}, sha = 'a'.repeat(40)) {
  const merged = new Map(Object.entries({ ...raw.records, ...records }).filter(([, record]) => record))
  return createBundle(merged, 'fr', sha)
}

const anyHash = Object.keys(raw.records)[0]!

describe('createBundle', () => {
  it('should read the records of a bundle', () => {
    const bundle = bundleWith()
    expect(bundle.record(anyHash)?.text).toBe(raw.records[anyHash]!.text)
    expect(bundle.record('0'.repeat(16))).toBeUndefined()
    expect(bundle.reviewed).toBe(false)
  })

  it('should read a malformed record as missing', () => {
    const bundle = bundleWith({ [anyHash]: { ...raw.records[anyHash], review: 'approved' } })
    expect(bundle.record(anyHash)).toBeUndefined()
  })

  it('should read a record filed under another hash as missing', () => {
    const [first, second] = Object.keys(raw.records)
    const bundle = bundleWith({ [first!]: raw.records[second!] })
    expect(bundle.record(first!)).toBeUndefined()
  })

  it('should note a bundle with reviewed records', () => {
    expect(bundleWith({ [anyHash]: { ...raw.records[anyHash], review: 'edited', by: 'danielroe' } }).reviewed).toBe(true)
  })
})

describe('visibleRecord', () => {
  it('should show machine translations of a locale that shows them', () => {
    expect(visibleRecord(bundleWith(), anyHash)?.origin).toBe('mt')
    expect(visibleRecord(emptyBundle('fr'), anyHash)).toBeUndefined()
  })
})

describe('coverage', () => {
  it('should count every word of a machine translated page as machine', () => {
    const coverage = fileCoverage(manifest.files[INTRODUCTION]!, bundleWith())
    const words = manifest.files[INTRODUCTION]!.reduce((sum, { words }) => sum + words, 0)
    expect(coverage.words).toBe(words)
    expect(coverage.byStatus.machine).toBe(words - (coverage.byStatus.untranslated ?? 0))
    expect(reviewedShare(coverage)).toBe(0)
    expect(isIndexableCoverage(coverage)).toBe(false)
  })

  it('should make a page indexable once 80 percent of its words are reviewed', () => {
    const segments = manifest.files[INTRODUCTION]!.filter(({ words }) => words > 0)
    const total = segments.reduce((sum, { words }) => sum + words, 0)
    const reviewed: Record<string, Record<string, unknown>> = {}
    let words = 0
    for (const { hash, words: count } of [...segments].sort((a, b) => b.words - a.words)) {
      if (words / total >= 0.8 || !raw.records[hash]) continue
      reviewed[hash] = { ...raw.records[hash], review: 'verified', verifiedBy: { by: 'danielroe', at: '2026-11-02T00:00:00Z' } }
      words += count
    }
    const coverage = fileCoverage(segments, bundleWith(reviewed))
    expect(coverage.byStatus.verified).toBe(words)
    expect(isIndexableCoverage(coverage)).toBe(true)
  })

  it('should count records carried over from an earlier source as pending review', () => {
    const [{ hash, words }] = manifest.files[INTRODUCTION]!.filter(segment => segment.words > 0 && raw.records[segment.hash])
    const coverage = fileCoverage([{ hash, words }], bundleWith({ [hash]: { ...raw.records[hash], derived: 'carry', prev: '1'.repeat(16) } }))
    expect(coverage.byStatus).toEqual({ 'pending-review': words })
  })

  it('should count a translation that no longer fits its source as rejected', () => {
    const hash = 'baf35e0f2e2e1937'
    const segment = { hash, words: 22, kind: 'component-slot' as const, format: 'markdown' as const, skeleton: raw.records[hash]!.source as string, placeholders: ['link' as const] }
    expect(fileCoverage([segment], bundleWith()).byStatus).toEqual({ machine: 22 })
    const broken = bundleWith({ [hash]: { ...raw.records[hash], text: 'Essayez Nuxt en ligne.', review: 'verified', verifiedBy: { by: 'danielroe', at: '2026-11-02T00:00:00Z' } } })
    expect(fileCoverage([segment], broken).byStatus).toEqual({ rejected: 22 })
  })

  it('should key the table by page path and leave out files without a page', () => {
    const table = coverageTable(sourceCoverage(manifest, bundleWith()), file => file === INTRODUCTION ? ['/docs/4.x/getting-started/introduction'] : undefined)
    expect(Object.keys(table)).toEqual(['/docs/4.x/getting-started/introduction'])
  })

  it('should list every page serving the same file', () => {
    const paths = ['/docs/4.x/getting-started/introduction', '/docs/5.x/getting-started/introduction']
    const table = coverageTable(sourceCoverage(manifest, bundleWith()), file => file === INTRODUCTION ? paths : undefined)
    expect(Object.keys(table)).toEqual(paths)
    expect(table[paths[0]!]).toEqual(table[paths[1]!])
  })
})

describe('TRANSLATION_SOURCES', () => {
  it('should map each translated source to the instances reading the same repository and branch', () => {
    for (const source of TRANSLATION_SOURCES) {
      for (const key of source.instances) {
        const { source: instance } = instanceSource(key)
        expect({ key, repo: instance.repo, branch: instance.branch, dir: instance.contentDir }).toEqual({ key, repo: source.repo, branch: source.ref, dir: source.dir })
      }
    }
  })
})

describe('translations webhook', () => {
  it('should only act on the branch the site reads', () => {
    expect(isTranslationsPush('nuxt/translations', 'main')).toBe(true)
    expect(isTranslationsPush('nuxt/translations', 'renovate/foo')).toBe(false)
    expect(isTranslationsPush('nuxt/nuxt', 'main')).toBe(false)
  })

  it('should list the locales whose records a push changed', () => {
    expect(rebuiltLocales([
      { modified: ['fr/segments/00/00033b4b33874d8a.json', 'dist/fr.json'] },
      { added: ['xx/segments/00/00033b4b33874d8a.json', 'README.md'] }
    ])).toEqual(['fr'])
    expect(rebuiltLocales([{ removed: ['fr/segments/00/00033b4b33874d8a.json'] }])).toEqual(['fr'])
    expect(rebuiltLocales([{ modified: ['dist/fr.json', 'fr/style.yml', 'README.md'] }])).toEqual([])
  })

  it('should list the locales whose state or glossary a push changed', () => {
    expect(rebuiltLocales([{ modified: ['fr/locale.yml'] }])).toEqual(['fr'])
    expect(rebuiltLocales([{ modified: ['fr/glossary.yml'] }])).toEqual(['fr'])
    expect(rebuiltLocales([{ modified: ['xx/locale.yml'] }])).toEqual([])
  })

  it('should list every locale when a push changed a source manifest or the shared glossary', () => {
    expect(rebuiltLocales([{ modified: ['.diglot/manifest/nuxt-4.x.json'] }])).toEqual(['fr'])
    expect(rebuiltLocales([{ modified: ['glossary.yml'] }])).toEqual(['fr'])
  })

  it('should list the records two bundles disagree on', () => {
    const [edited, removed, kept] = Object.keys(raw.records)
    const after = bundleWith({ [edited!]: { ...raw.records[edited!], text: 'Autre', review: 'edited' }, [removed!]: undefined })
    const changed = changedHashes(bundleWith(), after)
    expect([...changed].sort()).toEqual([edited, removed].sort())
    expect(changed.has(kept!)).toBe(false)
  })
})
