import { parseRecord, type TranslationRecord } from '@diglot/core'
import type { L10nLocale } from '../../../shared/utils/l10n'

/** The translations repository: records, manifests and the per-locale bundles in `dist/`. */
export const TRANSLATIONS_REPO = 'nuxt/translations'
export const TRANSLATIONS_BRANCH = 'main'
export const TRANSLATIONS_DIR = 'dist'

/** One locale's translation records, read from `dist/<locale>.json` at one commit. */
export interface L10nBundle {
  locale: L10nLocale
  /** Commit of the translations repository; `''` for the empty bundle. */
  sha: string
  /** Whether any record was written or reviewed by a person: without one, no page can be indexed. */
  reviewed: boolean
  record: (hash: string) => TranslationRecord | undefined
}

/** A bundle without records: every segment shows its English source. */
export function emptyBundle(locale: L10nLocale): L10nBundle {
  return { locale, sha: '', reviewed: false, record: () => undefined }
}

/**
 * Check the shape of a `dist/<locale>.json` and wrap its records.
 * Throws on a bundle for another locale or an unknown version; a malformed record reads as missing.
 */
export function parseBundle(value: unknown, locale: L10nLocale, sha: string): L10nBundle {
  const bundle = value as { version?: unknown, locale?: unknown, records?: unknown } | null
  if (!bundle || typeof bundle !== 'object' || bundle.version !== 1 || bundle.locale !== locale) {
    throw new Error(`[l10n] ${locale} bundle at ${sha} has an unexpected shape`)
  }
  const records = bundle.records
  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new Error(`[l10n] ${locale} bundle at ${sha} has no records`)
  }

  const parsed = new Map<string, TranslationRecord | null>()
  const reviewed = Object.values(records).some((record: { review?: unknown, origin?: unknown } | null) =>
    record?.review === 'edited' || record?.review === 'verified' || record?.origin === 'human')

  return {
    locale,
    sha,
    reviewed,
    record(hash) {
      let record = parsed.get(hash)
      if (record === undefined) {
        try {
          record = Object.hasOwn(records, hash) ? parseRecord((records as Record<string, unknown>)[hash]) : null
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
