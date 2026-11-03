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
  hashes: () => MapIterator<string>
}

/** A bundle without records: every segment shows its English source. */
export function emptyBundle(locale: L10nLocale): L10nBundle {
  return { locale, sha: '', reviewed: false, record: () => undefined, hashes: () => new Map<string, never>().keys() }
}

function hasReviewedRecord(records: ReadonlyMap<string, unknown>): boolean {
  for (const record of records.values() as Iterable<{ review?: unknown, origin?: unknown } | null>) {
    if (record?.review === 'edited' || record?.review === 'verified' || record?.origin === 'human') return true
  }
  return false
}

/**
 * Wrap a locale's records, keyed by hash, parsing each on first use. A malformed record reads as
 * missing. Passing `reviewed` skips reading every record to find out.
 */
export function createBundle(records: ReadonlyMap<string, unknown>, locale: L10nLocale, sha: string, reviewed = hasReviewedRecord(records)): L10nBundle {
  const parsed = new Map<string, TranslationRecord | null>()

  return {
    locale,
    sha,
    reviewed,
    hashes: () => records.keys(),
    record(hash) {
      let record = parsed.get(hash)
      if (record === undefined) {
        try {
          record = records.has(hash) ? parseRecord(records.get(hash)) : null
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
