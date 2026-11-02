import { parseRecord, type TranslationRecord } from '@diglot/core'
import type { L10nLocale } from '../../../shared/utils/l10n'

/** The translations repository: records and source manifests. */
export const TRANSLATIONS_REPO = 'nuxt/translations'
export const TRANSLATIONS_BRANCH = 'main'

/** One locale's translation records at one commit of the translations repository. */
export interface L10nBundle {
  locale: L10nLocale
  /** Commit of the translations repository; `''` for the empty bundle. */
  sha: string
  /** Whether any record was written or reviewed by a person: without one, no page can be indexed. */
  reviewed: boolean
  record: (hash: string) => TranslationRecord | undefined
  hashes: () => string[]
}

/** A bundle without records: every segment shows its English source. */
export function emptyBundle(locale: L10nLocale): L10nBundle {
  return { locale, sha: '', reviewed: false, record: () => undefined, hashes: () => [] }
}

/** Wrap a locale's unparsed records, keyed by hash. A malformed record reads as missing. */
export function createBundle(records: Record<string, unknown>, locale: L10nLocale, sha: string): L10nBundle {
  const parsed = new Map<string, TranslationRecord | null>()
  const reviewed = Object.values(records as Record<string, { review?: unknown, origin?: unknown } | null>).some(record =>
    record?.review === 'edited' || record?.review === 'verified' || record?.origin === 'human')

  return {
    locale,
    sha,
    reviewed,
    hashes: () => Object.keys(records),
    record(hash) {
      let record = parsed.get(hash)
      if (record === undefined) {
        try {
          record = Object.hasOwn(records, hash) ? parseRecord(records[hash]) : null
        } catch {
          record = null
        }
        if (record && record.hash !== hash) record = null
        parsed.set(hash, record)
      }
      return record ?? undefined
    }
  }
}
