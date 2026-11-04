import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Glossary, LocaleState } from '@diglot/core'
import { loadLocale, readManifests, type Manifest } from '@diglot/store'
import { archiveGlossary, archiveLocaleState, readArchive, type ArchiveInput } from '@diglot/store/runtime'
import { L10N_LOCALE_CODES, type L10nLocale } from '../../../shared/utils/l10n'

/** The files of the translations repository the site reads, at one commit. */
export interface TranslationsTree {
  sha: string
  /** Source manifests (`.diglot/manifest/<source>.json`), by source name. */
  manifests: Map<string, Manifest>
  /** Unparsed records of a locale (`<locale>/segments/<hh>/<hash>.json`), by hash. */
  records: (locale: L10nLocale) => ReadonlyMap<string, unknown>
  /** A locale's terminology: the shared `glossary.yml`, overridden term by term by `<locale>/glossary.yml`. */
  glossary: (locale: L10nLocale) => Glossary
  /** A locale's `<locale>/locale.yml`: its machine translation switch and review metrics. */
  localeState: (locale: L10nLocale) => LocaleState
}

const SHARED_GLOSSARY = 'glossary.yml'
const NO_RECORDS: ReadonlyMap<string, unknown> = new Map()

/** A locale's state, read from `files`; empty when missing or unreadable. */
function localeStates(files: Map<string, string>): TranslationsTree['localeState'] {
  return (locale) => {
    try {
      return archiveLocaleState({ files }, locale)
    } catch (error) {
      console.error(`[l10n] skipping ${locale}/locale.yml: ${(error as Error).message}`)
      return {}
    }
  }
}

/** The shared glossary and a locale's own, read from `files`; empty when missing or unreadable. */
function glossaryFrom(files: Map<string, string>, locale: L10nLocale): Glossary {
  try {
    return archiveGlossary({ files }, locale, { shared: SHARED_GLOSSARY }) ?? { terms: [] }
  } catch (error) {
    console.error(`[l10n] skipping the ${locale} glossary: ${(error as Error).message}`)
    return { terms: [] }
  }
}

/** Glossaries are parsed on first use, once per locale. */
function glossaries(files: Map<string, string>): TranslationsTree['glossary'] {
  const parsed = new Map<L10nLocale, Glossary>()
  return (locale) => {
    let glossary = parsed.get(locale)
    if (!glossary) parsed.set(locale, glossary = glossaryFrom(files, locale))
    return glossary
  }
}

/**
 * Read a tarball of the translations repository (GitHub's `tar.gz` of one commit), as bytes or as it
 * arrives. Records and manifests that cannot be read are skipped.
 */
export async function parseTranslationsTarball(data: ArchiveInput, sha: string): Promise<TranslationsTree> {
  const { records, manifests, files, invalid } = await readArchive(data, { locales: L10N_LOCALE_CODES })
  if (invalid.length) console.error(`[l10n] skipping ${invalid.length} unreadable files at ${sha}: ${invalid.slice(0, 5).join(', ')}`)

  return { sha, manifests, records: locale => records.get(locale) ?? NO_RECORDS, glossary: glossaries(files), localeState: localeStates(files) }
}

/** Read a local checkout of the translations repository through `@diglot/store`. */
export async function readTranslationsCheckout(root: string, sha: string, locales: L10nLocale[]): Promise<TranslationsTree> {
  const [manifests, ...records] = await Promise.all([
    readManifests(join(root, '.diglot')),
    ...locales.map(locale => loadLocale(root, locale))
  ])
  const byLocale = new Map(locales.map((locale, index) => [locale, records[index]!]))

  const files = new Map<string, string>()
  await Promise.all([SHARED_GLOSSARY, ...locales.flatMap(locale => [`${locale}/glossary.yml`, `${locale}/locale.yml`])].map(async (path) => {
    const text = await readFile(join(root, path), 'utf8').catch(() => undefined)
    if (text !== undefined) files.set(path, text)
  }))

  return {
    sha,
    manifests: new Map(manifests.map(manifest => [manifest.source, manifest])),
    records: locale => byLocale.get(locale) ?? NO_RECORDS,
    glossary: glossaries(files),
    localeState: localeStates(files)
  }
}
