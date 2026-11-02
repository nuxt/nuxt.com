import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isIndexableCoverage, isIndexableDocsPath, isLocalisedPage, L10N_LOCALE_CODES, type L10nIndexable, type L10nLocale } from '#shared/utils/l10n'

/** How long a bundle that could not be read is served empty before the next attempt. */
const FAILED_BUNDLE_TTL = 60_000

/** Env var pointing at a local clone of the translations repository: read instead of GitHub. */
const TRANSLATIONS_PATH_ENV = 'NUXT_TRANSLATIONS_PATH'

/**
 * The translations commit the site serves: the last one that touched `dist/`.
 * Resolved and cached like a content instance's ref, so the push webhook refreshes it the same way.
 */
export function resolveTranslationsSha(opts: { refresh?: boolean } = {}): Promise<string> {
  return resolveContentSha(TRANSLATIONS_REPO, TRANSLATIONS_BRANCH, TRANSLATIONS_DIR, opts)
}

/** A file of the translations repository at `sha`, parsed as JSON. */
async function readTranslationsJson(file: string, sha: string): Promise<unknown> {
  const local = process.env[TRANSLATIONS_PATH_ENV]?.trim()
  if (local) return JSON.parse(await readFile(join(local, file), 'utf8'))

  return $fetch(`https://raw.githubusercontent.com/${TRANSLATIONS_REPO}/${sha}/${file}`, { responseType: 'json' })
}

/**
 * Page path for each file of a translation source, through the manifests of the instances reading it.
 * Translation files are keyed by repository path (`docs/<file>`), instance items by `<instance name>/<file>`.
 */
async function sourcePaths(source: (typeof TRANSLATION_SOURCES)[number]): Promise<Map<string, string>> {
  const paths = new Map<string, string>()
  await Promise.all(source.instances.map(async (key) => {
    const { name, source: instance } = instanceSource(key)
    if (normalizeContentDir(instance.contentDir) !== source.dir) return
    const content = await getInstanceAtHead(key)
    for (const item of Object.values((await content.manifest()).items)) {
      const file = item.meta.key.slice(name.length + 1)
      if (item.meta.key.startsWith(`${name}/`) && isLocalisedPage(item.path)) paths.set(`${source.dir}/${file}`, item.path)
    }
  }))
  return paths
}

/** Each translated source's manifest at `sha`, with the page path of each of its files. */
function readSources(sha: string): Promise<Array<{ manifest: SourceManifest, paths: Map<string, string> }>> {
  return Promise.all(TRANSLATION_SOURCES.map(async (source) => {
    const [manifest, paths] = await Promise.all([
      readTranslationsJson(`.diglot/manifest/${source.name}.json`, sha) as Promise<SourceManifest>,
      sourcePaths(source)
    ])
    return { manifest, paths }
  }))
}

/** The localised pages of `bundle` reviewed enough to be indexed. */
async function indexablePages(bundle: L10nBundle): Promise<string[]> {
  if (!bundle.reviewed) return []

  return (await readSources(bundle.sha))
    .flatMap(({ manifest, paths }) => Object.entries(coverageTable(manifest, bundle, file => paths.get(file))))
    .filter(([path, coverage]) => isIndexableDocsPath(path) && isIndexableCoverage(coverage))
    .map(([path]) => path)
    .sort()
}

const indexable = new Map<string, Promise<string[]>>()

/**
 * The localised pages that may be indexed, by locale: listed in the sitemap and in the `hreflang`
 * of their English twin. Computed once per bundle commit; a locale that cannot be read lists none.
 */
export async function getL10nIndexable(): Promise<L10nIndexable> {
  const entries = await Promise.all(L10N_LOCALE_CODES.map(async (locale) => {
    const bundle = await getL10nBundle(locale)
    const key = `${locale}@${bundle.sha}`
    let pages = indexable.get(key)
    if (!pages) {
      for (const stale of indexable.keys()) if (stale.startsWith(`${locale}@`)) indexable.delete(stale)
      pages = indexablePages(bundle).catch((error) => {
        console.error(`[l10n] could not compute the ${locale} coverage at ${bundle.sha}`, error?.message ?? error)
        indexable.delete(key)
        return []
      })
      indexable.set(key, pages)
    }
    return [locale, await pages] as const
  }))
  return Object.fromEntries(entries)
}

/** Bundles by locale, for the lifetime of this server instance; only the current sha is kept. */
const bundles = new Map<L10nLocale, { sha: string, bundle: Promise<L10nBundle>, failedAt?: number }>()

/**
 * The bundle `locale` is served from, at the pinned translations commit.
 * A bundle that cannot be resolved, fetched or parsed is served empty: the page renders in English.
 */
export async function getL10nBundle(locale: L10nLocale): Promise<L10nBundle> {
  const sha = await resolveTranslationsSha().catch((error) => {
    console.error('[l10n] could not resolve the translations commit', error?.message ?? error)
    return undefined
  })
  if (!sha) return bundles.get(locale)?.bundle ?? emptyBundle(locale)

  const current = bundles.get(locale)
  if (current?.sha === sha && (!current.failedAt || Date.now() - current.failedAt < FAILED_BUNDLE_TTL)) {
    return current.bundle
  }

  const entry: { sha: string, bundle: Promise<L10nBundle>, failedAt?: number } = { sha, bundle: Promise.resolve(emptyBundle(locale)) }
  entry.bundle = (async () => {
    const startedAt = performance.now()
    try {
      return parseBundle(await readTranslationsJson(`${TRANSLATIONS_DIR}/${locale}.json`, sha), locale, sha)
    } catch (error) {
      console.error(`[l10n] could not read the ${locale} bundle at ${sha}`, (error as Error)?.message ?? error)
      entry.failedAt = Date.now()
      return emptyBundle(locale)
    } finally {
      recordDuration('l10n.bundle.read.ms', startedAt, { locale })
    }
  })()
  bundles.set(locale, entry)

  return entry.bundle
}
