import { isDocVersion, type DocVersion } from '#shared/utils/docs'

/**
 * Where one instance reads from: a repo directory, mounted under one prefix.
 *
 * One instance per source, each on a single commit — so a push only invalidates that instance.
 */
export interface InstanceSource {
  /** Repo the content is read from. */
  repo: string
  /** Prefix the content is mounted under. */
  prefix: string
  /** Branch the content is read from. */
  branch: string
  /** Directory within the repo this instance reads. */
  contentDir: string
  /** Frontmatter kept in the manifest (everything `list()` and `navigation()` can see) */
  listingFields?: string[]
  /** Glob patterns, relative to `contentDir`, never read. */
  exclude?: string[]
  /** Env var pointing at a local clone (see `README.md`): reads it instead of GitHub, watched in dev. */
  envOverride?: string
  /** Read from the local `contentDir` in dev (this repo's own content). */
  local?: boolean
}

/** `satisfies` makes a new version in `#shared/utils/docs` a type error until it is mapped here. */
const DOCS_REFS = {
  '3.x': { branch: '3.x', envOverride: 'NUXT_V3_PATH' },
  '4.x': { branch: '4.x', envOverride: 'NUXT_V4_PATH' },
  '5.x': { branch: 'main', envOverride: 'NUXT_V5_PATH' }
} as const satisfies Record<DocVersion, { branch: string, envOverride: string }>

/**
 * Limited listing fields for docs and examples.
 */
const DOCS_LISTING_FIELDS = ['title', 'description', 'navigation', 'titleTemplate', 'icon']

/** A contributor readme, not a page. */
const DOCS_EXCLUDE = ['README.md']

/**
 * Examples are **not** version-scoped.
 * They live at one canonical prefix, linked from every version's navigation.
 */
export function instanceSource(key: ContentInstanceKey): InstanceSource {
  if (key === 'site') {
    return { repo: 'nuxt/nuxt.com', branch: 'main', contentDir: 'content', prefix: '/', local: true }
  }
  if (key === 'examples') {
    return {
      repo: 'nuxt/examples',
      branch: 'main',
      contentDir: '.docs/',
      prefix: '/docs/examples',
      listingFields: DOCS_LISTING_FIELDS,
      exclude: DOCS_EXCLUDE,
      envOverride: 'NUXT_EXAMPLES_PATH'
    }
  }

  const version = key.slice('docs:'.length)
  if (!isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: `Unknown content instance: ${key}` })
  }
  return {
    repo: 'nuxt/nuxt',
    branch: DOCS_REFS[version].branch,
    contentDir: 'docs',
    prefix: `/docs/${version}`,
    listingFields: DOCS_LISTING_FIELDS,
    exclude: DOCS_EXCLUDE,
    envOverride: DOCS_REFS[version].envOverride
  }
}

/**
 * The commit this instance reads
 * - in dev the branch name
 * - otherwise the latest commit that touched the instance's content directory
 */
export function resolveInstanceSha(key: ContentInstanceKey, opts: { refresh?: boolean } = {}): Promise<string> {
  const source = instanceSource(key)

  if (import.meta.dev) return Promise.resolve(source.branch)

  return resolveContentSha(source.repo, source.branch, source.contentDir, opts)
}
