import { createStorage } from 'unstorage'
import type { H3Event } from 'h3'
import type { NavigationItem } from 'comark-content'
import type { PullPreviewSummary } from '#shared/types'
import { CONTENT_INSTANCE_KEYS, type ContentInstanceKey } from '#shared/utils/content'
import { parsePullTarget, pullRepoName, type PullTarget } from '#shared/utils/pull'
import type { InstanceResolver } from './index'

/**
 * `/pull/:repo/:number` previews: which commit and instances a pull request maps to, and who may preview it.
 *
 * Public and unauthenticated, so every lookup is cached, misses included.
 */

/** Label a maintainer adds to a fork PR to make it previewable. */
export const PULL_PREVIEW_LABEL = 'preview:enabled'

/** A preview follows new pushes, and a removed label revokes it, within this bound. */
const PULL_TTL = 600

/** Sentinel for "no preview for this PR", so unknown numbers don't each cost a GitHub call. */
const UNRESOLVED = '\0unresolved'

const pullStorage = createStorage({ driver: githubRefCacheDriver(PULL_TTL) })

export interface PullPreview {
  target: PullTarget
  title: string
  url: string
  /** The PR's head commit. */
  sha: string
  /** The instances reading the PR's base branch, current docs version first. */
  keys: ContentInstanceKey[]
  /** Repo paths the PR adds or modifies. */
  files: string[]
}

interface GitHubPull {
  title: string
  html_url: string
  head: { sha: string, repo: { full_name: string } | null }
  base: { ref: string }
  labels: Array<{ name: string }>
}

function githubHeaders(): Record<string, string> {
  const token = contentGithubToken()
  return {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

/** `repo`'s instances reading `branch`: `nuxt/cli`'s `main` backs both `cli:4.x` and `cli:5.x`. */
export function pullInstanceKeys(repo: string, branch: string): ContentInstanceKey[] {
  return CONTENT_INSTANCE_KEYS.filter((key) => {
    const { source } = instanceSource(key)
    return source.repo === repo && source.branch === branch
  })
}

/**
 * Same-repo PRs come from people who can push to the repo anyway.
 * Fork PRs need a maintainer's label, or any fork's markdown would render on nuxt.com.
 */
function allowsPreview(pull: GitHubPull, repo: string): boolean {
  if (pull.head.repo?.full_name === repo) return true
  return pull.labels.some(label => label.name === PULL_PREVIEW_LABEL)
}

/** The PR behind `target`, or a 404 when it doesn't exist, targets no instance or isn't allowed. */
export async function resolvePullPreview(target: PullTarget): Promise<PullPreview> {
  const repo = pullRepoName(target.repo)
  const key = `pull:${repo}:${target.number}`
  const notFound = () => createError({ status: 404, statusText: `No preview available for ${repo}#${target.number}` })

  const cached = await pullStorage.getItem<PullPreview | typeof UNRESOLVED>(key)
  if (cached === UNRESOLVED) throw notFound()
  if (cached) return cached

  const deny = async (): Promise<never> => {
    await pullStorage.setItem(key, UNRESOLVED, { ttl: PULL_TTL })
    throw notFound()
  }

  // Not cached, so the next request retries; GitHub's message would leak this server's IP on a rate limit.
  const unavailable = (cause: unknown) => createError({ status: 502, statusText: 'Could not reach GitHub', cause })

  const api = `https://api.github.com/repos/${repo}/pulls/${target.number}`
  const pull = await $fetch<GitHubPull>(api, { headers: githubHeaders() }).catch((error) => {
    // Only a definitive 404 is cacheable.
    if ((error as { status?: number }).status === 404) return null
    throw unavailable(error)
  })
  if (!pull) return deny()

  // A PR against a branch no instance reads (a feature branch, an old major) has nothing to preview.
  const keys = pullInstanceKeys(repo, pull.base.ref)
  if (!keys.length || !allowsPreview(pull, repo)) return deny()

  const files = await $fetch<Array<{ filename: string, status: string }>>(`${api}/files`, {
    headers: githubHeaders(),
    query: { per_page: 100 }
  }).catch((error) => {
    throw unavailable(error)
  })

  const preview: PullPreview = {
    target,
    title: pull.title,
    url: pull.html_url,
    sha: pull.head.sha,
    keys,
    files: files.filter(file => file.status !== 'removed').map(file => file.filename)
  }
  await pullStorage.setItem(key, preview, { ttl: PULL_TTL })

  return preview
}

/** The PR's head commit for the instances it targets, the live heads for the rest. */
export function pullResolver(preview: PullPreview): InstanceResolver {
  return key => preview.keys.includes(key) ? getInstanceAtPull(key, preview.sha) : getInstanceAtHead(key)
}

/** The `:repo` and `:number` route params, validated. */
export function pullTargetFromEvent(event: H3Event): PullTarget {
  const target = parsePullTarget(getRouterParam(event, 'repo'), getRouterParam(event, 'number'))
  if (!target) {
    throw createError({ status: 404, statusText: 'Unknown pull request' })
  }

  return target
}

/** The pages the PR adds or changes, read off its first instance: the others read the same files. */
export async function pullPages(preview: PullPreview): Promise<PullPreviewSummary['pages']> {
  const key = preview.keys[0]!
  const content = await getInstanceAtPull(key, preview.sha)
  const dir = `${instanceSource(key).source.contentDir.replace(/\/+$/, '')}/`

  return preview.files.flatMap((file) => {
    const entry = file.startsWith(dir) ? content.stat(file.slice(dir.length)) : undefined
    if (!entry) return []

    return [{ title: String(entry.data?.title || entry.path), path: entry.path }]
  })
}

function firstPagePath(items: NavigationItem[] | undefined): string | undefined {
  const first = items?.[0]
  if (!first) return

  return first.children?.length ? firstPagePath(first.children) : first.path
}

/** Where `/pull/:repo/:number` lands: the first changed page, else the first page the PR's instance serves. */
export async function pullLandingPath(preview: PullPreview): Promise<string> {
  const [page] = await pullPages(preview)
  if (page) return page.path

  const key = preview.keys[0]!
  const { prefix } = instanceSource(key).source
  if (prefix === '/') return prefix

  const content = await getInstanceAtPull(key, preview.sha)

  return firstPagePath(findByPath(await content.navigation(), prefix)?.children) ?? prefix
}
