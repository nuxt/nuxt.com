// Single source of truth for which Nuxt docs versions are exposed.

export const DOCS_REPO = 'nuxt/nuxt'

/** Where a version's docs read from: the branch, and an env var that can override it with a local clone. */
export interface RepoRefs {
  branch: string
  envOverride: string
}

export const DOCS_REFS = {
  '3.x': { branch: '3.x', envOverride: 'NUXT_V3_PATH' },
  '4.x': { branch: '4.x', envOverride: 'NUXT_V4_PATH' },
  '5.x': { branch: 'main', envOverride: 'NUXT_V5_PATH' }
} as const satisfies Record<DocVersion, RepoRefs>

// Published and crawlable versions.
export const SUPPORTED_DOC_VERSIONS = ['3.x', '4.x'] as const

// Excluded versions (not yet published).
export const EXCLUDED_DOC_VERSIONS = ['5.x'] as const

// The current stable version.
export const CURRENT_DOCS_VERSION: (typeof SUPPORTED_DOC_VERSIONS)[number] = '4.x'

/** Every version with content behind it, exposed or not. */
export const DOC_VERSIONS = [...SUPPORTED_DOC_VERSIONS, ...EXCLUDED_DOC_VERSIONS] as const

export type DocVersion = (typeof DOC_VERSIONS)[number]

/** The bare major behind a `DocVersion`: `'4.x'` → `'4'`. */
export type Major = DocVersion extends `${infer M}.x` ? M : never

export function isDocVersion(value: string): value is DocVersion {
  return (DOC_VERSIONS as readonly string[]).includes(value)
}

/**
 * Where a version's docs are mounted.
 */
export function docsPathPrefix(version: DocVersion): string {
  return `/docs/${version}`
}

/** The major behind a version: `'4.x'` → `'4'`. Everything display-facing (`v4`, `Version 4`, npm's `4x` tag) derives from this. */
export function docsMajor(version: DocVersion): Major {
  return version.slice(0, version.indexOf('.')) as Major
}

/**
 * Whether a path belongs to a version of the docs.
 */
export function isVersionedDocsPath(path: string): boolean {
  return DOC_VERSIONS.some((version) => {
    const prefix = docsPathPrefix(version)
    return path === prefix || path.startsWith(`${prefix}/`)
  })
}

const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `^/docs/(?:3\.x|4\.x)(?:/|$)` — matches versioned doc paths only.
export const SUPPORTED_DOCS_PATH_REGEX = new RegExp(
  `^/docs/(?:${SUPPORTED_DOC_VERSIONS.map(escape).join('|')})(?:/|$)`
)
