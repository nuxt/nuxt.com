/**
 * Pull request previews: `/pull/:repo/:number` mirrors `github.com/nuxt/:repo/pull/:number`.
 *
 * The whole site is mounted under that prefix, with the instances the PR targets pinned to its head commit.
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
