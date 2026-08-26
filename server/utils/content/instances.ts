import { markdownField } from 'comark-content/plugins/markdown-fields'
import type { JsonSchema } from 'comark-content'
import { CLI_DOCS_REFS, CLI_DOCS_REPO, CLI_DOCS_PREFIX } from '#shared/utils/cli-docs'
import { isDocVersion, type DocVersion } from '#shared/utils/docs'

/**
 * Where one source reads from: a repo directory, mounted under one prefix.
 *
 * Each source sits on a single commit, so a push only invalidates the instances reading it.
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
  /** Partial `data` schema — only the fields needing a declared type or transform. */
  schema?: JsonSchema
  /** Env var pointing at a local clone (see `README.md`): reads it instead of GitHub. */
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
 * Markdown held inside data files, parsed by `markdownFields()` instead of at render time.
 */
const SITE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    hero: {
      type: 'object',
      properties: {
        tabs: {
          type: 'array',
          items: {
            type: 'object',
            properties: { content: markdownField() }
          }
        }
      }
    }
  }
}

/**
 * The command reference lives in `nuxt/cli`, not `nuxt/nuxt`, but reads as part of each
 * version's API section — so every docs instance mounts it as a second source, and
 * excludes the directory from the main source to avoid serving both.
 */
const CLI_DOCS_EXCLUDE = [`${CLI_DOCS_PREFIX}/**`]

/**
 * The sources an instance reads, keyed by source name.
 *
 * Examples are **not** version-scoped: they live at one canonical prefix, linked from
 * every version's navigation.
 */
export function instanceSources(key: ContentInstanceKey): Record<string, InstanceSource> {
  if (key === 'site') {
    return {
      site: { repo: 'nuxt/nuxt.com', branch: 'main', contentDir: 'content', prefix: '/', local: true, schema: SITE_SCHEMA }
    }
  }
  if (key === 'examples') {
    return {
      examples: {
        repo: 'nuxt/examples',
        branch: 'main',
        contentDir: '.docs/',
        prefix: '/docs/examples',
        listingFields: DOCS_LISTING_FIELDS,
        exclude: DOCS_EXCLUDE,
        envOverride: 'NUXT_EXAMPLES_PATH'
      }
    }
  }

  const version = key.slice('docs:'.length)
  if (!isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: `Unknown content instance: ${key}` })
  }
  return {
    docs: {
      repo: 'nuxt/nuxt',
      branch: DOCS_REFS[version].branch,
      contentDir: 'docs',
      prefix: `/docs/${version}`,
      listingFields: DOCS_LISTING_FIELDS,
      exclude: [...DOCS_EXCLUDE, ...CLI_DOCS_EXCLUDE],
      envOverride: DOCS_REFS[version].envOverride
    },
    cli: {
      repo: CLI_DOCS_REPO,
      branch: CLI_DOCS_REFS[version],
      contentDir: 'docs',
      prefix: `/docs/${version}/api/commands`,
      listingFields: DOCS_LISTING_FIELDS,
      exclude: DOCS_EXCLUDE,
      envOverride: 'NUXT_CLI_PATH'
    }
  }
}

/**
 * The commit each of the instance's sources reads
 * - in dev the branch name
 * - otherwise the latest commit that touched that source's content directory
 */
export async function resolveInstanceShas(
  key: ContentInstanceKey,
  opts: { refresh?: boolean } = {}
): Promise<Record<string, string>> {
  const sources = instanceSources(key)

  const entries = await Promise.all(
    Object.entries(sources).map(async ([name, source]) => [
      name,
      import.meta.dev ? source.branch : await resolveContentSha(source.repo, source.branch, source.contentDir, opts)
    ] as const)
  )

  return Object.fromEntries(entries)
}

/**
 * One opaque identity for a set of source shas: memoization key and cache namespace.
 *
 * A single-source instance keeps its bare sha, so its namespace is unchanged.
 */
export function instanceShaKey(shas: Record<string, string>): string {
  const names = Object.keys(shas).sort()

  if (names.length === 1) return shas[names[0]!]!

  return names.map(name => `${name}@${shas[name]}`).join('+')
}
