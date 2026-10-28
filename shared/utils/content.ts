import { CLI_DOC_VERSIONS, hasCliDocs, type CliDocVersion } from './cli'
import { DOC_VERSIONS, hasExamples, isArchivedDocVersion, isDocVersion, type DocVersion } from './docs'
import { MODULE_DOCS_NAMES, hasModuleDocs, type ModuleDocsName } from './module-docs'

/**
 * Identifies one of the content instances nuxt.com reads from.
 * One per repository, each pinned to a commit sha:
 * - `site` is nuxt.com's own content (blog, deploy, landing pages, agencies, templates…)
 * - `docs:<version>` a version of the Nuxt docs, from `nuxt/nuxt`
 * - `cli:<version>` the command reference backing that version, from `nuxt/cli` — mounted
 *   under the docs URL tree (`/docs/<version>/api/commands`) but its own repo, so its own instance
 * - `examples` the `nuxt/examples` showcase
 * - `module:<name>` a module's docs, from its own repo — mounted under its module page (`/modules/<name>`)
 */
export type ContentInstanceKey = 'site' | 'examples' | `docs:${DocVersion}` | `cli:${CliDocVersion}` | `module:${ModuleDocsName}`

/** The docs instance serving `version`, e.g. `docsInstanceKey('4.x') === 'docs:4.x'`. */
export function docsInstanceKey(version: DocVersion): ContentInstanceKey {
  return `docs:${version}`
}

/** The cli instance backing `version`'s command reference, e.g. `cliInstanceKey('4.x') === 'cli:4.x'`. */
export function cliInstanceKey(version: CliDocVersion): ContentInstanceKey {
  return `cli:${version}`
}

/** The instance serving a module's docs, e.g. `moduleInstanceKey('icon') === 'module:icon'`. */
export function moduleInstanceKey(name: ModuleDocsName): ContentInstanceKey {
  return `module:${name}`
}

/** Every instance nuxt.com serves, derived so a new docs version cannot be missed. */
export const CONTENT_INSTANCE_KEYS: ContentInstanceKey[] = [
  'site',
  'examples',
  ...DOC_VERSIONS.map(docsInstanceKey),
  ...CLI_DOC_VERSIONS.map(cliInstanceKey),
  ...MODULE_DOCS_NAMES.map(moduleInstanceKey)
]

/**
 * Instances indexed for search.
 */
export function searchInstanceKeys(version: DocVersion): ContentInstanceKey[] {
  return [
    docsInstanceKey(version),
    ...(hasCliDocs(version) ? [cliInstanceKey(version)] : []),
    ...(hasExamples(version) ? ['examples' as const] : []),
    ...(hasModuleDocsSearch(version) ? MODULE_DOCS_NAMES.map(moduleInstanceKey) : [])
  ]
}

/** Hosted module docs target current Nuxt: an archived version searches and lists only its own docs. */
export function hasModuleDocsSearch(version: DocVersion): boolean {
  return !isArchivedDocVersion(version)
}

/** Every instance whose sha-pinned search artifacts must stay fresh, across every docs version. */
export const SEARCH_INDEXED_KEYS: Set<ContentInstanceKey> = new Set(DOC_VERSIONS.flatMap(searchInstanceKeys))

/**
 * Whether `value` names an instance nuxt.com actually serves.
 *
 * The single answer to "is this a real instance", so the resolvers in
 * `server/utils/content/instances.ts` cannot drift from this type as versions come and go.
 */
export function isContentInstanceKey(value: string): value is ContentInstanceKey {
  if (value === 'site' || value === 'examples') return true
  if (value.startsWith('docs:')) return isDocVersion(value.slice('docs:'.length))
  if (value.startsWith('module:')) return hasModuleDocs(value.slice('module:'.length))

  return value.startsWith('cli:') && hasCliDocs(value.slice('cli:'.length))
}

/** URL segment(s) an instance is served under — `docs:4.x` lives at `/api/content/docs/4.x`. */
export function instanceBasePath(key: ContentInstanceKey): string {
  return `/api/content/${key.replace(':', '/')}`
}

/**
 * Same instance, pinned to a commit — `/api/content/blob/<sha>/docs/4.x`.
 *
 * Immutable, so the artifacts under it are cached forever (`isr: true`)
 */
export function instanceBlobPath(key: ContentInstanceKey, sha: string): string {
  return `/api/content/blob/${sha}/${key.replace(':', '/')}`
}

/**
 * The comark instance name behind `key` — `docs:4.x` → `docs`, `cli:4.x` → `cli`, `module:color-mode` → `module_color_mode`.
 *
 * Versions share a name (search composes one version at a time), but every module's docs are searched
 * together, and `contentHub()` rejects duplicate names. Comark names are identifiers: `-` becomes `_`.
 */
export function instanceName(key: ContentInstanceKey): string {
  return key.startsWith('module:') ? key.replace(/[:-]/g, '_') : key.split(':')[0]!
}

/** Directory configuration (`.navigation.yml`), which contributes to the tree rather than a page. */
export function isNavigationConfig(file: string): boolean {
  return file.split('/').pop()!.startsWith('.navigation')
}

/**
 * Where a version's navigation tree is served — `navigationPath('4.x') === '/api/navigation/4.x'`.
 */
export function navigationPath(version: DocVersion): string {
  return `/api/navigation/${version}`
}

/**
 * Which navigation endpoint(s) a change to `key` affects.
 */
export function navPathsForInstance(key: ContentInstanceKey): string[] {
  if (key === 'site' || key === 'examples') return DOC_VERSIONS.map(navigationPath)
  // Grafted into every searching version's tree, for the palette to place its results.
  if (key.startsWith('module:')) return DOC_VERSIONS.filter(hasModuleDocsSearch).map(navigationPath)

  return [navigationPath(key.split(':')[1] as DocVersion)]
}
