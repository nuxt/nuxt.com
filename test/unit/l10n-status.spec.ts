import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createBundle } from '../../server/utils/l10n/bundle'
import type { SourceManifest } from '../../server/utils/l10n/coverage'
import { localeStatus } from '../../server/utils/l10n/status'

const fixture = (file: string) => JSON.parse(readFileSync(new URL(`../fixtures/l10n/${file}`, import.meta.url), 'utf8'))
const records = (fixture('fr.json') as { records: Record<string, Record<string, unknown>> }).records
const manifest = fixture('manifest.json') as SourceManifest

const INTRODUCTION = '/docs/4.x/getting-started/introduction'
const USE_FETCH = '/docs/4.x/api/composables/use-fetch'
const NOW = new Date('2026-11-03T00:00:00Z')
const pages = new Map([
  [INTRODUCTION, manifest.files['docs/1.getting-started/01.introduction.md']!],
  [USE_FETCH, manifest.files['docs/4.api/2.composables/use-fetch.md']!],
  [INTRODUCTION.replace('4.x', '3.x'), manifest.files['docs/1.getting-started/01.introduction.md']!]
])
const introduction = pages.get(INTRODUCTION)!.filter(segment => segment.words && records[segment.hash])
const [first, second, third, fourth] = introduction as [typeof introduction[number], typeof introduction[number], typeof introduction[number], typeof introduction[number]]

const verified = (hash: string, by: string, at: string) => ({ ...records[hash], review: 'verified', verifiedBy: { by, at } })
const edited = (hash: string, by: string, at: string) => ({ ...records[hash], origin: 'human', review: 'edited', text: `${records[hash]!.text} modifié`, by, updatedAt: at })

const status = (overrides: Record<string, unknown> = {}, machine = true) => localeStatus({
  locale: 'fr',
  bundle: createBundle(new Map(Object.entries({ ...records, ...overrides })), 'fr', 'a'.repeat(40)),
  pages,
  indexable: new Set([USE_FETCH]),
  machine,
  now: NOW
})

describe('localeStatus', () => {
  it('should count every segment once across pages sharing it', () => {
    const result = status()
    const words = new Map([...pages.values()].flat().filter(segment => segment.words).map(segment => [segment.hash, segment.words]))
    expect(result.coverage.words).toBe([...words.values()].reduce((sum, count) => sum + count, 0))
    expect(result.pages.map(page => page.path)).toEqual([INTRODUCTION.replace('4.x', '3.x'), USE_FETCH, INTRODUCTION])
    expect(result.pages.find(page => page.path === USE_FETCH)?.indexable).toBe(true)
    expect(result.indexable).toBe(1)
    expect(result.reviewed).toBe(0)
  })

  it('should list who reviewed recently, and how much of the machine translation they kept', () => {
    const result = status({
      [first.hash]: verified(first.hash, 'danielroe', '2026-11-01T00:00:00Z'),
      [second.hash]: verified(second.hash, 'danielroe', '2026-10-30T00:00:00Z'),
      [third.hash]: edited(third.hash, 'atinux', '2026-10-20T00:00:00Z'),
      [fourth.hash]: verified(fourth.hash, 'someone', '2026-01-01T00:00:00Z')
    })
    expect(result.activeReviewers).toEqual([{ login: 'danielroe', count: 2 }, { login: 'atinux', count: 1 }])
    expect(result.approvalRate).toBe(3 / 4)
    expect(result.editRatio).toBeGreaterThan(0)
    expect(result.pages.find(page => page.path === INTRODUCTION)?.byStatus.verified).toBe(first.words + second.words + fourth.words)
    expect(result.recommendation).toBeUndefined()
  })

  it('should count a rejection as a review that kept nothing', () => {
    const result = status({
      [first.hash]: verified(first.hash, 'danielroe', '2026-11-01T00:00:00Z'),
      [second.hash]: { ...records[second.hash], review: 'rejected', rejectedBy: { by: 'atinux', at: '2026-11-02T00:00:00Z' } }
    })
    expect(result.approvalRate).toBe(1 / 2)
    expect(result.activeReviewers).toEqual([{ login: 'atinux', count: 1 }, { login: 'danielroe', count: 1 }])
    expect(result.pages.find(page => page.path === INTRODUCTION)?.byStatus.rejected).toBe(second.words)
  })

  it('should count segments waiting for review and how long they waited', () => {
    const result = status({
      [first.hash]: { ...records[first.hash], derived: 'update', prev: '1'.repeat(16), updatedAt: '2026-10-24T00:00:00Z' },
      [second.hash]: { ...records[second.hash], derived: 'carry', prev: '2'.repeat(16), updatedAt: '2026-11-01T00:00:00Z' }
    })
    expect(result.pending).toEqual({ segments: 2, oldestDays: 10, medianDays: 6 })
    expect(result.pages.find(page => page.path === INTRODUCTION)?.pending).toBe(2)
  })

  it('should recommend switching machine translation off without an active reviewer, and on with one', () => {
    expect(status().recommendation).toEqual({ machine: false, reason: 'Machine translation should switch off for fr: no reviewer in 8 weeks.' })
    expect(status({ [first.hash]: verified(first.hash, 'danielroe', '2026-11-01T00:00:00Z') }, false).recommendation)
      .toEqual({ machine: true, reason: 'Machine translation could switch on for fr: 1 active reviewer.' })
  })

  /** `reviewed` machine translations reviewed this week, the first `kept` verified unchanged and the rest edited. */
  function reviewedRecords(reviewed: number, kept: number) {
    return Object.fromEntries(Array.from({ length: reviewed }, (_, index) => {
      const hash = index.toString(16).padStart(16, 'a')
      const record = { hash, source: 'Source', text: 'Texte', origin: 'mt', derived: 'fresh', mt: { model: 'model', candidate: 'Texte' }, updatedAt: '2026-11-01T00:00:00Z' }
      return [hash, index < kept
        ? { ...record, review: 'verified', verifiedBy: { by: 'danielroe', at: '2026-11-01T00:00:00Z' } }
        : { ...record, origin: 'human', review: 'edited', text: 'Un texte tout autre', by: 'danielroe' }]
    }))
  }

  it('should recommend switching machine translation off when reviewers keep under 40 percent of 50 or more', () => {
    expect(status(reviewedRecords(50, 19)).recommendation).toEqual({
      machine: false,
      reason: 'Machine translation should switch off for fr: reviewers kept 38% of 50 reviewed machine translations unchanged, below 40%.'
    })
    expect(status(reviewedRecords(50, 20)).recommendation).toBeUndefined()
    expect(status(reviewedRecords(120, 47)).recommendation?.machine).toBe(false)
  })

  it('should not apply the approval rate below 50 reviewed machine translations', () => {
    expect(status(reviewedRecords(49, 0)).approvalRate).toBe(0)
    expect(status(reviewedRecords(49, 0)).recommendation).toBeUndefined()
  })

  it('should not recommend switching machine translation on while the approval rate is too low', () => {
    expect(status(reviewedRecords(50, 19), false).recommendation).toBeUndefined()
    expect(status(reviewedRecords(50, 20), false).recommendation?.machine).toBe(true)
  })
})
