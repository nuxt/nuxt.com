import { readFileSync } from 'node:fs'
import { countWords } from '@diglot/core'
import { describe, expect, it } from 'vitest'
import { createBundle, emptyBundle } from '../../server/utils/l10n/bundle'
import { l10nContributors } from '../../server/utils/l10n/contributors'

const fixture = (file: string) => JSON.parse(readFileSync(new URL(`../fixtures/l10n/${file}`, import.meta.url), 'utf8'))
const records = (fixture('fr.json') as { records: Record<string, Record<string, unknown>> }).records
const [a, b, c, d, e] = Object.keys(records) as [string, string, string, string, string]
const words = (hash: string) => countWords(records[hash]!.source as string)
const AT = '2026-11-01T00:00:00Z'

const edited = (hash: string, by: string) => ({ ...records[hash], origin: 'human', review: 'edited', text: `${records[hash]!.text} modifié`, by, updatedAt: AT })
const verified = (hash: string, by: string, editor?: string) => ({ ...records[hash], review: 'verified', verifiedBy: { by, at: AT }, ...(editor ? { origin: 'human', by: editor } : {}) })
const rejected = (hash: string, by: string) => ({ ...records[hash], review: 'rejected', rejectedBy: { by, at: AT } })

const contributors = (overrides: Record<string, unknown>) =>
  l10nContributors(createBundle(new Map(Object.entries({ ...records, ...overrides })), 'fr', 'a'.repeat(40)))

describe('l10nContributors', () => {
  it('should count the segments each login edited, verified and rejected, with their words', () => {
    expect(contributors({
      [a]: edited(a, 'D3ller'),
      [b]: verified(b, 'd3ller'),
      [c]: rejected(c, 'danielroe'),
      [d]: verified(d, 'danielroe')
    })).toEqual({
      d3ller: { edited: 1, verified: 1, rejected: 0, words: words(a) + words(b) },
      danielroe: { edited: 0, verified: 1, rejected: 1, words: words(c) + words(d) }
    })
  })

  it('should credit the verifier of an edited segment, not its editor', () => {
    expect(contributors({ [e]: verified(e, 'danielroe', 'atinux') })).toEqual({
      danielroe: { edited: 0, verified: 1, rejected: 0, words: words(e) }
    })
  })

  it('should list nobody for machine translations and malformed records', () => {
    expect(contributors({ [a]: { ...edited(a, 'atinux'), hash: 'not-the-key' }, [b]: { nope: true } })).toEqual({})
    expect(l10nContributors(emptyBundle('fr'))).toEqual({})
  })

  it('should keep logins that are also object keys as plain entries', () => {
    const index = contributors({ [a]: edited(a, 'constructor') })
    expect(Object.hasOwn(index, 'constructor')).toBe(true)
    expect(index.constructor).toEqual({ edited: 1, verified: 0, rejected: 0, words: words(a) })
    expect(Object.hasOwn(index, 'toString')).toBe(false)
  })
})
