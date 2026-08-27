import { isDocVersion, type DocVersion } from './docs'

/**
 * Identifies one of the content instances nuxt.com reads from.
 * One per repository, each pinned to a commit sha:
 * - `site` is nuxt.com's own content (blog, deploy, landing pages, agencies, templates…)
 * - `docs:<version>` a version of the Nuxt docs
 * - `examples` the `nuxt/examples` showcase
 */
export type ContentInstanceKey = 'site' | 'examples' | `docs:${DocVersion}`

/** The docs instance serving `version`, e.g. `docsInstanceKey('4.x') === 'docs:4.x'`. */
export function docsInstanceKey(version: DocVersion): ContentInstanceKey {
  return `docs:${version}`
}

/**
 * Whether `value` names an instance nuxt.com actually serves.
 *
 * The single answer to "is this a real instance", so the resolvers in
 * `server/utils/content/instances.ts` cannot drift from this type as versions come and go.
 */
export function isContentInstanceKey(value: string): value is ContentInstanceKey {
  if (value === 'site' || value === 'examples') return true

  return value.startsWith('docs:') && isDocVersion(value.slice('docs:'.length))
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
 * Where an instance reports the base to read it from — `/api/content/head/docs/4.x`.
 *
 * Immutable, so the artifacts under it are cached forever (`isr: true`)
 */
export function instanceHeadPath(key: ContentInstanceKey): string {
  return `/api/content/head/${key.replace(':', '/')}`
}
