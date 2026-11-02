import { join } from 'node:path'
import { loadLocale, readManifests, recordPath, type Manifest } from '@diglot/store'
import { parseTarGzip } from 'nanotar'
import type { L10nLocale } from '../../../shared/utils/l10n'

/** The files of the translations repository the site reads, at one commit. */
export interface TranslationsTree {
  sha: string
  /** Source manifests (`.diglot/manifest/<source>.json`), by source name. */
  manifests: Map<string, Manifest>
  /** Unparsed records of a locale (`<locale>/segments/<hh>/<hash>.json`), by hash. */
  records: (locale: L10nLocale) => Record<string, unknown>
}

const RECORD_RE = /^([^/]+)\/segments\/[0-9a-f]{2}\/([0-9a-f]{16})\.json$/
const MANIFEST_RE = /^\.diglot\/manifest\/([^/]+)\.json$/

/**
 * Read a tarball of the translations repository (GitHub's `tar.gz` of one commit).
 * Entries sit under one top-level directory, which is dropped. A file that is not valid JSON is skipped.
 */
export async function parseTranslationsTarball(data: Uint8Array, sha: string): Promise<TranslationsTree> {
  const records = new Map<string, Record<string, unknown>>()
  const manifests = new Map<string, Manifest>()

  const entries = await parseTarGzip(data, {
    filter: entry => entry.type === 'file' && entry.name.endsWith('.json')
  })
  for (const entry of entries) {
    const path = entry.name.slice(entry.name.indexOf('/') + 1)
    const record = RECORD_RE.exec(path)
    const manifest = record ? undefined : MANIFEST_RE.exec(path)
    if (!record && !manifest) continue

    let value: unknown
    try {
      value = JSON.parse(entry.text)
    } catch {
      console.error(`[l10n] skipping ${path} at ${sha}: not valid JSON`)
      continue
    }

    if (record) {
      const locale = record[1]!
      const hash = record[2]!
      if (recordPath(locale, hash) !== path) continue
      let byHash = records.get(locale)
      if (!byHash) records.set(locale, byHash = {})
      byHash[hash] = value
    } else {
      if ((value as Manifest | null)?.files) manifests.set(manifest![1]!, value as Manifest)
    }
  }

  return { sha, manifests, records: locale => records.get(locale) ?? {} }
}

/** Read a local checkout of the translations repository through `@diglot/store`. */
export async function readTranslationsCheckout(root: string, sha: string, locales: L10nLocale[]): Promise<TranslationsTree> {
  const [manifests, ...records] = await Promise.all([
    readManifests(join(root, '.diglot')),
    ...locales.map(locale => loadLocale(root, locale))
  ])
  const byLocale = new Map(locales.map((locale, index) => [locale, Object.fromEntries(records[index]!) as Record<string, unknown>]))

  return {
    sha,
    manifests: new Map(manifests.map(manifest => [manifest.source, manifest])),
    records: locale => byLocale.get(locale) ?? {}
  }
}
