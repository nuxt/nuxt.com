import type { ContentInstanceKey } from './content'
import type { DocVersion } from './docs'

/**
 * Pull request previews: `/pull/:repo/:number` mirrors `github.com/nuxt/:repo/pull/:number`.
 *
 * The whole site is mounted under that prefix, with the instance the PR replaces pinned to its head commit.
 */

/** Repos in the `nuxt` org a content instance reads from; the PR's base branch picks which instances. */
export const PULL_REPOS = ['nuxt', 'cli', 'examples', 'nuxt.com'] as const

export type PullRepo = (typeof PULL_REPOS)[number]

export interface PullTarget {
  repo: PullRepo
  number: number
}

export function isPullRepo(value: string): value is PullRepo {
  return (PULL_REPOS as readonly string[]).includes(value)
}

/** The GitHub repo behind a preview: `cli` → `nuxt/cli`. */
export function pullRepoName(repo: PullRepo): string {
  return `nuxt/${repo}`
}

/** Digits, no leading zero, small enough to stay a safe integer. */
const PULL_NUMBER_RE = /^[1-9]\d{0,9}$/

/** Validate untrusted route params: each distinct target costs a GitHub call and a content instance. */
export function parsePullTarget(repo: string | undefined, number: string | undefined): PullTarget | null {
  if (!repo || !number || !isPullRepo(repo) || !PULL_NUMBER_RE.test(number)) return null

  return { repo, number: Number(number) }
}

/** Where a preview is mounted: `/pull/nuxt/33012`. */
export function pullBasePath(target: PullTarget): string {
  return `/pull/${target.repo}/${target.number}`
}

/** The preview's metadata endpoint: title, link and changed pages. */
export function pullApiPath(target: PullTarget): string {
  return `/api${pullBasePath(target)}`
}

/** An instance's live endpoint, as a pull request previews it: `/api/content/pull/nuxt/33012/docs/5.x`. */
export function instancePullPath(key: ContentInstanceKey, pull: PullTarget): string {
  return `/api/content${pullBasePath(pull)}/${key.replace(':', '/')}`
}

/** The instance a preview replaces and its commit: `/api/content/pull/nuxt/33012/head`. */
export function pullHeadPath(pull: PullTarget): string {
  return `/api/content${pullBasePath(pull)}/head`
}

/**
 * An instance's search artifacts, pinned to the commit the preview reads it at.
 * `/api/content/pull/nuxt/33012/blob/<sha>/docs/5.x` — immutable, so cached forever (`isr: true`).
 */
export function instancePullBlobPath(key: ContentInstanceKey, pull: PullTarget, sha: string): string {
  return `/api/content${pullBasePath(pull)}/blob/${sha}/${key.replace(':', '/')}`
}

/** A version's navigation tree, as a pull request previews it: `/api/navigation/pull/nuxt/33012/5.x`. */
export function pullNavigationPath(version: DocVersion, pull: PullTarget): string {
  return `/api/navigation${pullBasePath(pull)}/${version}`
}

/**
 * The `nuxt` org repo `key` reads from, as `/pull/:repo` names it.
 * Pinned to `instanceSource(key).source.repo` by `test/unit/pull-paths.spec.ts`.
 */
export function instanceRepo(key: ContentInstanceKey): PullRepo {
  if (key === 'site') return 'nuxt.com'
  if (key === 'examples') return 'examples'

  return key.startsWith('cli:') ? 'cli' : 'nuxt'
}

const PULL_PATH_RE = /^\/pull\/([^/?#]+)\/([^/?#]+)/

/**
 * Split a preview URL into its target and the page it mirrors.
 * `/pull/nuxt/33012/docs/5.x/guide?x=1` → `nuxt#33012`, path `/docs/5.x/guide?x=1`.
 */
export function parsePullPath(url: string): { target: PullTarget, path: string } | null {
  const match = PULL_PATH_RE.exec(url)
  const target = match && parsePullTarget(match[1], match[2])
  if (!match || !target) return null

  const rest = url.slice(match[0].length)

  return { target, path: rest.startsWith('/') ? rest : `/${rest}` }
}

/**
 * Pages that render content, the only ones a preview mirrors: an exact path, or a prefix with `/**`.
 * Pinned to the pages calling `useContent()` by `test/unit/pull-paths.spec.ts`.
 */
export const PULL_CONTENT_PAGES = [
  '/',
  '/blog/**',
  '/deploy/**',
  '/design-kit',
  '/docs/**',
  '/enterprise/agencies/**',
  '/enterprise/jobs',
  '/enterprise/sponsors',
  '/enterprise/support',
  '/evals',
  '/modules',
  '/newsletter',
  '/showcase',
  '/team',
  '/templates',
  '/video-courses'
]

/** Whether a preview mirrors `path` (query and trailing slash ignored), instead of sending it to production. */
export function isPullContentPage(path: string): boolean {
  const pathname = path.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'

  return PULL_CONTENT_PAGES.some(page => page.endsWith('/**')
    ? pathname === page.slice(0, -3) || pathname.startsWith(page.slice(0, -2))
    : pathname === page)
}
