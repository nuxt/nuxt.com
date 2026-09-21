import { DOC_VERSIONS, isDocVersion, type DocVersion } from './docs'

/**
 * Identifies one of the content instances nuxt.com reads from.
 * One per repository, each pinned to a commit sha:
 * - `site` is nuxt.com's own content (blog, deploy, landing pages, agencies, templates…)
 * - `docs:<version>` a version of the Nuxt docs, from `nuxt/nuxt`
 * - `cli:<version>` the command reference backing that version, from `nuxt/cli` — mounted
 *   under the docs URL tree (`/docs/<version>/api/commands`) but its own repo, so its own instance
 * - `examples` the `nuxt/examples` showcase
 */
export type ContentInstanceKey = 'site' | 'examples' | `docs:${DocVersion}` | `cli:${DocVersion}`

/** The docs instance serving `version`, e.g. `docsInstanceKey('4.x') === 'docs:4.x'`. */
export function docsInstanceKey(version: DocVersion): ContentInstanceKey {
  return `docs:${version}`
}

/** The cli instance backing `version`'s command reference, e.g. `cliInstanceKey('4.x') === 'cli:4.x'`. */
export function cliInstanceKey(version: DocVersion): ContentInstanceKey {
  return `cli:${version}`
}

/** Every instance nuxt.com serves, derived so a new docs version cannot be missed. */
export const CONTENT_INSTANCE_KEYS: ContentInstanceKey[] = [
  'site',
  'examples',
  ...DOC_VERSIONS.map(docsInstanceKey),
  ...DOC_VERSIONS.map(cliInstanceKey)
]

/**
 * Instances indexed for search.
 */
export function searchInstanceKeys(version: DocVersion): ContentInstanceKey[] {
  return [docsInstanceKey(version), cliInstanceKey(version), 'examples']
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

  return value.startsWith('cli:') && isDocVersion(value.slice('cli:'.length))
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
 * The comark instance name behind `key` — `docs:4.x` → `docs`, `cli:4.x` → `cli`.
 *
 */
export function instanceName(key: ContentInstanceKey): string {
  return key.split(':')[0]!
}
