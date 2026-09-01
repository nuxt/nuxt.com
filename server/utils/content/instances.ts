import { markdownField } from 'comark-content/plugins/markdown-fields'
import type { JsonSchema } from 'comark-content'
import type { GithubSource } from 'comark-content/sources/github'
import type { FSSourceOptions } from 'comark-content/sources/fs'
import { CLI_DOCS_REFS, CLI_DOCS_REPO, CLI_DOCS_PREFIX, cliDocsPathPrefix } from '#shared/utils/cli'
import { DOCS_REFS, DOCS_REPO, docsPathPrefix, isDocVersion } from '#shared/utils/docs'
import { CONTENT_INSTANCE_KEYS, isContentInstanceKey, cliInstanceKey, docsInstanceKey, type ContentInstanceKey } from '#shared/utils/content'

/** What comark-content's sources own; a required `prefix` is what the page resolver depends on. */
type ComarkSourceOptions = Pick<GithubSource & FSSourceOptions, 'exclude' | 'schema'> & {
  prefix: string
}

/**
 * Where an instance reads from: a repo directory, mounted under one prefix.
 *
 * One instance, one repo, one commit — a push only ever invalidates the instance reading it.
 */
export interface InstanceSource extends ComarkSourceOptions {
  /** Repo the content is read from. */
  repo: string
  /** Branch the content is read from. */
  branch: string
  /** Directory within the repo this instance reads. */
  contentDir: string
  /** Frontmatter kept in the manifest (everything `list()` and `navigation()` can see) */
  listingFields?: string[]
  /** Env var pointing at a local clone (see `README.md`): reads it instead of GitHub. */
  envOverride?: string
  /** Read from the local `contentDir` in dev (this repo's own content). */
  local?: boolean
}

/**
 * Limited listing fields for docs and examples.
 */
const DOCS_LISTING_FIELDS = ['title', 'description', 'navigation', 'titleTemplate', 'icon']

/** A contributor readme, not a page. */
const DOCS_EXCLUDE = ['README.md']

/**
 * Per-source branch overrides (testing the push webhook off a non-production branch).
 */
const BRANCH_ENV: Record<ContentInstanceKey, string> = {
  'site': 'NUXT_COM_BRANCH',
  'examples': 'NUXT_EXAMPLES_BRANCH',
  'docs:3.x': 'NUXT_V3_BRANCH',
  'docs:4.x': 'NUXT_V4_BRANCH',
  'docs:5.x': 'NUXT_V5_BRANCH',
  'cli:3.x': 'NUXT_CLI_BRANCH',
  'cli:4.x': 'NUXT_CLI_BRANCH',
  'cli:5.x': 'NUXT_CLI_BRANCH'
}

/** Resolve a branch, honouring env var overrides; log a warning if one is active in production. */
function branchFor(key: ContentInstanceKey, fallback: string): string {
  const envVar = BRANCH_ENV[key]
  const override = process.env[envVar]?.trim()
  if (override && process.env.VERCEL_ENV === 'production') {
    console.warn(`[content] branch override active in production: ${envVar}=${override} (${key})`)
  }
  return override || fallback
}

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
 * The instance's source.
 */
export function instanceSource(key: ContentInstanceKey): { name: string, source: InstanceSource } {
  if (key === 'site') {
    return {
      name: 'site',
      source: { repo: 'nuxt/nuxt.com', branch: branchFor('site', 'main'), contentDir: 'content', prefix: '/', local: true, schema: SITE_SCHEMA }
    }
  }
  if (key === 'examples') {
    return {
      name: 'examples',
      source: {
        repo: 'nuxt/examples',
        branch: branchFor('examples', 'main'),
        contentDir: '.docs/',
        prefix: '/docs/examples',
        listingFields: DOCS_LISTING_FIELDS,
        exclude: DOCS_EXCLUDE,
        envOverride: 'NUXT_EXAMPLES_PATH'
      }
    }
  }
  if (key.startsWith('cli:')) {
    const version = key.slice('cli:'.length)
    if (!isDocVersion(version)) {
      throw createError({ statusCode: 404, statusMessage: `Unknown content instance: ${key}` })
    }
    return {
      name: 'cli',
      source: {
        repo: CLI_DOCS_REPO,
        branch: branchFor(key as ContentInstanceKey, CLI_DOCS_REFS[version].branch),
        contentDir: 'docs',
        prefix: cliDocsPathPrefix(version),
        listingFields: DOCS_LISTING_FIELDS,
        exclude: DOCS_EXCLUDE,
        envOverride: CLI_DOCS_REFS[version].envOverride
      }
    }
  }

  const version = key.slice('docs:'.length)
  if (!isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: `Unknown content instance: ${key}` })
  }
  return {
    name: 'docs',
    source: {
      repo: DOCS_REPO,
      branch: branchFor(key as ContentInstanceKey, DOCS_REFS[version].branch),
      contentDir: 'docs',
      prefix: docsPathPrefix(version),
      listingFields: DOCS_LISTING_FIELDS,
      exclude: [...DOCS_EXCLUDE, `${CLI_DOCS_PREFIX}/**`],
      envOverride: DOCS_REFS[version].envOverride
    }
  }
}

/**
 * The commit `key`'s source reads
 * - in dev the branch name
 * - otherwise the latest commit that touched that source's content directory
 */
export async function resolveInstanceSha(
  key: ContentInstanceKey,
  opts: { refresh?: boolean } = {}
): Promise<string> {
  const { source } = instanceSource(key)

  // `resolveContentSha` itself returns `branch` unresolved in dev.
  return resolveContentSha(source.repo, source.branch, source.contentDir, opts)
}

/**
 * Page-path prefix → instance, longest first: `/docs/4.x/api/commands` must beat `/docs/4.x`.
 * Derived from each instance's own `prefix`, so mounting and resolution can't disagree.
 */
let cachedPagePrefixes: Array<readonly [string, ContentInstanceKey]> | undefined

function pagePrefixes(): Array<readonly [string, ContentInstanceKey]> {
  return cachedPagePrefixes ??= CONTENT_INSTANCE_KEYS
    .map(key => [instanceSource(key).source.prefix, key] as const)
    .filter(([prefix]) => prefix !== '/')
    .sort((a, b) => b[0].length - a[0].length)
}

/**
 * The instance serving a page URL — `/docs/4.x/…`, `/docs/4.x/api/commands/…`,
 * `/docs/examples/…`, or anything else on the site.
 */
export function instanceFromPagePath(path: string): ContentInstanceKey {
  const match = pagePrefixes().find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))

  return match?.[1] ?? 'site'
}

/**
 * The instance an `/api/content/…` path targets, from its leading segments — the inverse of
 * `instanceBasePath()`:
 * - `site/…` (nuxt.com's own content: blog, deploy, landing pages…)
 * - `examples/…` (the examples instance, code examples)
 * - `docs/<version>/…` (one instance per docs version)
 * - `cli/<version>/…` (one instance per docs version's command reference)
 *
 * Shared by the live, `head/` and `blob/<sha>/` routes, which must agree on where an instance's
 * prefix begins — they are the same path with different qualifiers in front. Unlike
 * `instanceFromPagePath()` there is no fallback: an unknown prefix is a bad URL, not site content.
 */
export function instanceKeyFromSegments(segments: string[]): ContentInstanceKey {
  const [first, second] = segments
  const version = second as DocVersion

  let key: string
  if (first === 'docs') key = docsInstanceKey(version)
  else if (first === 'cli') key = cliInstanceKey(version)
  else key = first ?? ''

  if (isContentInstanceKey(key)) return key

  throw createError({ statusCode: 404, statusMessage: 'Unknown content instance' })
}
