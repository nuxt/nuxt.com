// Single source of truth for which Nuxt docs versions are exposed.

export const DOCS_REPO = 'nuxt/nuxt'

/** Where a version's docs read from: the branch, and an env var that can override it with a local clone. */
export interface RepoRefs {
  branch: string
  envOverride: string
}

export const DOCS_REFS = {
  '2.x': { branch: '2.x', envOverride: 'NUXT_V2_PATH' },
  '3.x': { branch: '3.x', envOverride: 'NUXT_V3_PATH' },
  '4.x': { branch: '4.x', envOverride: 'NUXT_V4_PATH' },
  '5.x': { branch: 'main', envOverride: 'NUXT_V5_PATH' }
} as const satisfies Record<DocVersion, RepoRefs>

// Archived: docs only (no command reference, no examples), noindex, and hidden from agents.
export const ARCHIVED_DOC_VERSIONS = ['2.x'] as const

// Live: published and crawlable.
export const LIVE_DOC_VERSIONS = ['3.x', '4.x'] as const

// Next: not released yet, kept out of crawlers.
export const NEXT_DOC_VERSIONS = ['5.x'] as const

// The current stable version.
export const CURRENT_DOCS_VERSION: (typeof LIVE_DOC_VERSIONS)[number] = '4.x'

/** Every version with content behind it, oldest first. */
export const DOC_VERSIONS = [...ARCHIVED_DOC_VERSIONS, ...LIVE_DOC_VERSIONS, ...NEXT_DOC_VERSIONS] as const

/** Versions agents read (llms.txt, MCP, agent sources): every version but the archived ones. */
export const AGENT_DOC_VERSIONS = [...LIVE_DOC_VERSIONS, ...NEXT_DOC_VERSIONS] as const

export type DocVersion = (typeof DOC_VERSIONS)[number]

export type ArchivedDocVersion = (typeof ARCHIVED_DOC_VERSIONS)[number]

/** How a version's docs are served, from the list it belongs to. */
export type DocsStatus = 'archived' | 'live' | 'next'

/** The bare major behind a `DocVersion`: `'4.x'` → `'4'`. */
export type Major = DocVersion extends `${infer M}.x` ? M : never

export function isDocVersion(value: string): value is DocVersion {
  return (DOC_VERSIONS as readonly string[]).includes(value)
}

export function isArchivedDocVersion(version: DocVersion): version is ArchivedDocVersion {
  return (ARCHIVED_DOC_VERSIONS as readonly string[]).includes(version)
}

export function docsStatus(version: DocVersion): DocsStatus {
  if (isArchivedDocVersion(version)) return 'archived'

  return (NEXT_DOC_VERSIONS as readonly string[]).includes(version) ? 'next' : 'live'
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

/** Where the examples showcase is mounted — under `/docs`, but unversioned. */
export const EXAMPLES_PATH_PREFIX = '/docs/examples'

/** Whether a version lists the examples: they are Nuxt 3+ code, so archived versions don't. */
export function hasExamples(version: DocVersion): boolean {
  return !isArchivedDocVersion(version)
}

/** The version a path belongs to: `/docs/4.x/guide` → `'4.x'`, `undefined` outside the versioned docs. */
export function getVersionByPath(path: string): DocVersion | undefined {
  return DOC_VERSIONS.find((version) => {
    const prefix = docsPathPrefix(version)
    return path === prefix || path.startsWith(`${prefix}/`)
  })
}

/**
 * Whether a `/docs/*` URL is the authoritative one, so it can carry `rel="canonical"` and a markdown alternate.
 */
export function isCanonicalDocsPath(path: string): boolean {
  const version = getVersionByPath(path)
  if (version) return docsStatus(version) === 'live'

  return path === EXAMPLES_PATH_PREFIX || path.startsWith(`${EXAMPLES_PATH_PREFIX}/`)
}
