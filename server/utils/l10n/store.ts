import { mtEnabled, type ManifestEntry } from '@diglot/store'
import { createStorage } from 'unstorage'
import { isIndexableCoverage, isIndexableDocsPath, isLocalisedPage, L10N_LOCALE_CODES, type L10nIndexable, type L10nLocale, type L10nLocaleStatus } from '#shared/utils/l10n'

/** How long a bundle that could not be read is served empty before the next attempt. */
const FAILED_BUNDLE_TTL = 60_000

/** Env var pointing at a local clone of the translations repository: read instead of GitHub. */
const TRANSLATIONS_PATH_ENV = 'NUXT_TRANSLATIONS_PATH'

/**
 * The translations commit the site serves: the head of the translations branch.
 * Resolved and cached like a content instance's ref, so the push webhook refreshes it the same way.
 */
export function resolveTranslationsSha(opts: { refresh?: boolean } = {}): Promise<string> {
  return resolveContentSha(TRANSLATIONS_REPO, TRANSLATIONS_BRANCH, '', opts)
}

/** The records and manifests at `sha`: one tarball of the repository, or the local clone. */
async function fetchTranslationsTree(sha: string): Promise<TranslationsTree> {
  const local = process.env[TRANSLATIONS_PATH_ENV]?.trim()
  if (local) return readTranslationsCheckout(local, sha, L10N_LOCALE_CODES)

  const data = await $fetch<ReadableStream<Uint8Array>>(`https://codeload.github.com/${TRANSLATIONS_REPO}/tar.gz/${sha}`, { responseType: 'stream' })
  return parseTranslationsTarball(data, sha)
}

/** The tree of the last commit read, for the lifetime of this server instance. */
let currentTree: { sha: string, tree: Promise<TranslationsTree> } | undefined

/** The records and manifests at `sha`. Throws when they cannot be read; the next call retries. */
export function getTranslationsTree(sha: string): Promise<TranslationsTree> {
  if (currentTree?.sha === sha) return currentTree.tree

  const entry = {
    sha,
    tree: (async () => {
      const startedAt = performance.now()
      try {
        return await fetchTranslationsTree(sha)
      } finally {
        recordDuration('l10n.tree.read.ms', startedAt)
      }
    })().catch((error) => {
      if (currentTree === entry) currentTree = undefined
      throw error
    })
  }
  currentTree = entry

  return entry.tree
}

/**
 * Page paths of each file of a translation source, through the manifests of the instances reading it:
 * one per instance, as several docs versions can read the same branch.
 * Translation files are keyed by repository path (`docs/<file>`), instance items by `<instance name>/<file>`.
 */
async function sourcePaths(source: (typeof TRANSLATION_SOURCES)[number]): Promise<Map<string, string[]>> {
  const paths = new Map<string, string[]>()
  await Promise.all(source.instances.map(async (key) => {
    const { name, source: instance } = instanceSource(key)
    if (normalizeContentDir(instance.contentDir) !== source.dir) return
    const content = await getInstanceAtHead(key)
    for (const item of Object.values((await content.manifest()).items)) {
      const file = item.meta.key.slice(name.length + 1)
      if (!item.meta.key.startsWith(`${name}/`) || !isLocalisedPage(item.path)) continue
      const key = `${source.dir}/${file}`
      paths.set(key, [...paths.get(key) ?? [], item.path])
    }
  }))
  return paths
}

/** Each translated source's manifest at `sha`, with the page paths of each of its files. */
async function readSources(sha: string): Promise<Array<{ manifest: SourceManifest, paths: Map<string, string[]> }>> {
  const { manifests } = await getTranslationsTree(sha)
  return Promise.all(TRANSLATION_SOURCES.map(async source => ({
    manifest: manifests.get(source.name) ?? { files: {} },
    paths: await sourcePaths(source)
  })))
}

/** The segments of each localised page at `sha`, by page path. */
export async function l10nPageSegments(sha: string): Promise<Map<string, readonly ManifestEntry[]>> {
  const pages = new Map<string, readonly ManifestEntry[]>()
  for (const { manifest, paths } of await readSources(sha)) {
    for (const [file, segments] of Object.entries(manifest.files ?? {})) {
      for (const path of paths.get(file) ?? []) pages.set(path, segments)
    }
  }
  return pages
}

const statuses = new Map<string, Promise<L10nLocaleStatus>>()

/** The review state of `locale`, computed once per translations commit and commit of the translated instances. */
export async function getL10nStatus(locale: L10nLocale): Promise<L10nLocaleStatus> {
  const bundle = await getL10nBundle(locale)
  const key = `${locale}@${bundle.sha}:${await translatedInstancesKey()}`
  let status = statuses.get(key)
  if (!status) {
    for (const stale of statuses.keys()) if (stale.startsWith(`${locale}@`)) statuses.delete(stale)
    status = (async () => {
      const [pages, indexable, tree] = await Promise.all([
        bundle.sha ? l10nPageSegments(bundle.sha) : new Map<string, readonly ManifestEntry[]>(),
        getL10nIndexable(),
        bundle.sha ? getTranslationsTree(bundle.sha) : undefined
      ])
      return localeStatus({ locale, bundle, pages, indexable: new Set(indexable[locale] ?? []), machine: !!tree && mtEnabled(tree.localeState(locale)) })
    })().catch((error) => {
      statuses.delete(key)
      throw error
    })
    statuses.set(key, status)
  }
  return status
}

/** `indexablePages` of `snapshot`, kept in KV under `key` and the build so instances share one computation. */
async function sharedIndexablePages(key: string, snapshot: L10nSnapshot): Promise<string[]> {
  const storageKey = `l10n:indexable:${useRuntimeConfig().app.buildId}:${key}`
  const stored = await kv.get<string[]>(storageKey).catch(() => null)
  if (stored) return stored
  const pages = await indexablePages(snapshot)
  await kv.set(storageKey, pages, { ttl: 60 * 60 * 24 * 7 }).catch(() => {})
  return pages
}

/** The localised pages of a snapshot reviewed enough to be indexed. */
async function indexablePages({ bundle, coverage }: L10nSnapshot): Promise<string[]> {
  if (!bundle.reviewed) return []

  const tables = await Promise.all(TRANSLATION_SOURCES.map(async (source) => {
    const paths = await sourcePaths(source)
    return coverageTable(coverage[source.name] ?? {}, file => paths.get(file))
  }))
  return tables
    .flatMap(table => Object.entries(table))
    .filter(([path, coverage]) => isIndexableDocsPath(path) && isIndexableCoverage(coverage))
    .map(([path]) => path)
    .sort()
}

/**
 * The localised pages of the sources that use any of `hashes` at the bundle's commit, or every
 * localised page with `'all'`. `navigation` tells whether a navigation label or page title changed,
 * which every page of the tree renders.
 */
export async function l10nPagesUsing(bundle: L10nBundle, hashes: Set<string> | 'all'): Promise<{ pages: string[], navigation: boolean }> {
  const sources = await readSources(bundle.sha)
  let navigation = hashes === 'all'
  const pages = new Set<string>()
  for (const { manifest, paths } of sources) {
    for (const [file, segments] of Object.entries(manifest.files ?? {})) {
      const used = hashes === 'all' ? segments : segments.filter(segment => hashes.has(segment.hash))
      if (!used.length) continue
      if (used.some(segment => segment.kind === 'navigation' || segment.kind === 'frontmatter')) navigation = true
      for (const path of paths.get(file) ?? []) pages.add(path)
    }
  }
  if (navigation) for (const { paths } of sources) for (const path of [...paths.values()].flat()) pages.add(path)
  return { pages: [...pages].sort(), navigation }
}

const indexable = new Map<string, Promise<string[]>>()

/** The commits of every instance reading a translated source: what page paths are derived from. */
async function translatedInstancesKey(): Promise<string> {
  return (await Promise.all(TRANSLATION_SOURCES.flatMap(source => source.instances)
    .map(key => resolveInstanceSha(key).catch(() => '')))).join(',')
}

/**
 * The localised pages that may be indexed, by locale: listed in the sitemap and in the `hreflang`
 * of their English twin. Computed once per bundle commit and commit of the translated instances;
 * a locale that cannot be read lists none.
 */
export async function getL10nIndexable(): Promise<L10nIndexable> {
  const content = await translatedInstancesKey()
  const entries = await Promise.all(L10N_LOCALE_CODES.map(async (locale) => {
    const snapshot = await getL10nSnapshot(locale)
    const { bundle } = snapshot
    const key = `${locale}@${bundle.sha}:${content}`
    let pages = indexable.get(key)
    if (!pages) {
      for (const stale of indexable.keys()) if (stale.startsWith(`${locale}@`)) indexable.delete(stale)
      pages = sharedIndexablePages(key, snapshot).catch((error) => {
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

/** What a translations push changed for one locale. */
export interface L10nRefresh {
  locale: L10nLocale
  sha: string
  /** Localised pages showing a changed record, unprefixed. */
  pages: string[]
  navigation: boolean
  /** English pages whose localised twin became indexable, or stopped being. */
  indexableChanged: string[]
}

/** Pin the translations commit the branch is at now, and list what changed for each of `locales` since the previous one. */
export async function refreshL10nBundles(locales: L10nLocale[]): Promise<L10nRefresh[]> {
  const before = await Promise.all(locales.map(locale => getL10nBundle(locale)))
  const indexableBefore = await getL10nIndexable()

  const sha = await resolveTranslationsSha({ refresh: true })
  const after = await Promise.all(locales.map(locale => getL10nBundle(locale)))
  const indexableAfter = await getL10nIndexable()

  return Promise.all(locales.map(async (locale, index) => {
    const previous = before[index]!
    const current = after[index]!
    const { pages, navigation } = previous.sha === current.sha
      ? { pages: [], navigation: false }
      : await l10nPagesUsing(current, previous.sha ? changedHashes(previous, current) : 'all')
    const was = new Set(indexableBefore[locale] ?? [])
    const is = new Set(indexableAfter[locale] ?? [])
    const indexableChanged = [...new Set([...was, ...is])].filter(path => was.has(path) !== is.has(path)).sort()

    return { locale, sha, pages, navigation, indexableChanged }
  }))
}

/** Built snapshots, shared by every instance through the content cache, keyed by commit. */
const snapshotStorage = createStorage({ driver: contentCacheDriver('l10n') })

/**
 * `locale`'s snapshot at `sha`: read from the content cache, or built from the repository and stored
 * there for the next instance. Concurrent requests of one instance share one build.
 */
async function loadSnapshot(sha: string, locale: L10nLocale): Promise<L10nSnapshot> {
  const readAt = performance.now()
  const stored = await readL10nSnapshot(snapshotStorage, sha, locale).catch((error) => {
    console.error(`[l10n] could not read the stored ${locale} snapshot at ${sha}`, error?.message ?? error)
    return undefined
  })
  recordDuration('l10n.snapshot.read.ms', readAt, { locale, hit: String(!!stored) })
  if (stored) return stored

  const builtAt = performance.now()
  const tree = await getTranslationsTree(sha)
  const snapshot = buildL10nSnapshot(tree, locale)
  await writeL10nSnapshot(snapshotStorage, snapshot, tree.records(locale)).catch((error) => {
    console.error(`[l10n] could not store the ${locale} snapshot at ${sha}`, error?.message ?? error)
  })
  recordDuration('l10n.snapshot.build.ms', builtAt, { locale })
  return snapshot
}

/** Snapshots by locale, for the lifetime of this server instance; only the current sha is kept. */
const snapshots = new Map<L10nLocale, { sha: string, snapshot: Promise<L10nSnapshot>, failedAt?: number }>()

/**
 * What `locale` is served from at the pinned translations commit: its bundle and the coverage of every source file.
 * A snapshot that cannot be resolved, fetched or parsed is served empty: the page renders in English.
 */
export async function getL10nSnapshot(locale: L10nLocale): Promise<L10nSnapshot> {
  const sha = await resolveTranslationsSha().catch((error) => {
    console.error('[l10n] could not resolve the translations commit', error?.message ?? error)
    return undefined
  })
  if (!sha) return snapshots.get(locale)?.snapshot ?? emptySnapshot(locale)

  const current = snapshots.get(locale)
  if (current?.sha === sha && (!current.failedAt || Date.now() - current.failedAt < FAILED_BUNDLE_TTL)) {
    return current.snapshot
  }

  const entry: { sha: string, snapshot: Promise<L10nSnapshot>, failedAt?: number } = { sha, snapshot: loadSnapshot(sha, locale) }
  entry.snapshot = entry.snapshot.catch((error) => {
    console.error(`[l10n] could not read the ${locale} bundle at ${sha}`, (error as Error)?.message ?? error)
    entry.failedAt = Date.now()
    return emptySnapshot(locale)
  })
  snapshots.set(locale, entry)

  return entry.snapshot
}

/** The bundle `locale` is served from, at the pinned translations commit. */
export async function getL10nBundle(locale: L10nLocale): Promise<L10nBundle> {
  return (await getL10nSnapshot(locale)).bundle
}
