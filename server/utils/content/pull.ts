import { createStorage } from 'unstorage'
import type { H3Event } from 'h3'
import type { ComarkContent, NavigationItem } from 'comark-content'
import type { PullPreviewSummary } from '#shared/types'
import { cliDocsPathPrefix } from '#shared/utils/cli'
import { CONTENT_INSTANCE_KEYS, cliInstanceKey, docsInstanceKey, type ContentInstanceKey } from '#shared/utils/content'
import { docsPathPrefix, EXAMPLES_PATH_PREFIX, type DocVersion } from '#shared/utils/docs'
import { parsePullTarget, pullRepoName, type PullTarget } from '#shared/utils/pull'
import { createRuntimeInstance } from '../../../utils/factory'

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
  /** The instance the PR replaces, read at `sha`. */
  instanceKey: ContentInstanceKey
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

/**
 * The instance reading `repo`'s `branch`.
 * When several versions read it, the oldest wins: `nuxt/cli` `main` backs 4.x (current) and 5.x.
 */
export function pullInstanceKey(repo: string, branch: string): ContentInstanceKey | undefined {
  return CONTENT_INSTANCE_KEYS.find((key) => {
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
  const instanceKey = pullInstanceKey(repo, pull.base.ref)
  if (!instanceKey || !allowsPreview(pull, repo)) return deny()

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
    instanceKey,
    files: files.filter(file => file.status !== 'removed').map(file => file.filename)
  }
  await pullStorage.setItem(key, preview, { ttl: PULL_TTL })

  return preview
}

/** Unpinned bases previews pin, reading GitHub only: a PR never renders the local checkout. */
const pullBases = new Map<ContentInstanceKey, ComarkContent>()

function getPullBaseInstance(key: ContentInstanceKey): ComarkContent {
  let base = pullBases.get(key)
  if (!base) {
    base = createRuntimeInstance(key, {
      source: instanceSourceFor(key, { remote: true }),
      cache: { driver: contentCacheDriver(key) }
    })
    pullBases.set(key, base)
  }
  return base
}

/** Most pull request previews kept warm per server instance, least recently used evicted first. */
const MAX_PULL_INSTANCES = 8

/** Keyed by `key@sha`, holding the promise so concurrent requests share one init. */
const pullInstances = new Map<string, Promise<ComarkContent>>()

/**
 * The instance for `key` at a pull request's head commit.
 * Evicted instances are dropped, not disposed: a request may still be reading one.
 */
export function getInstanceAtPull(key: ContentInstanceKey, sha: string): Promise<ComarkContent> {
  const id = `${key}@${sha}`
  const existing = pullInstances.get(id)
  if (existing) {
    pullInstances.delete(id)
    pullInstances.set(id, existing)
    return existing
  }

  const instance: Promise<ComarkContent> = (async () => {
    const created = getPullBaseInstance(key).withRef(sha)
    const startedAt = performance.now()
    await created.init()
    recordDuration('content.pull.init.ms', startedAt, { instance: key })
    return created
  })().catch((error) => {
    if (pullInstances.get(id) === instance) pullInstances.delete(id)
    throw error
  })
  pullInstances.set(id, instance)

  for (const oldest of pullInstances.keys()) {
    if (pullInstances.size <= MAX_PULL_INSTANCES) break
    pullInstances.delete(oldest)
  }

  return instance
}

/** The instance serving `key` in this preview: the PR's head commit if it replaces `key`, production otherwise. */
export function getInstanceForPull(preview: PullPreview, key: ContentInstanceKey): Promise<ComarkContent> {
  return key === preview.instanceKey ? getInstanceAtPull(key, preview.sha) : getInstanceAtHead(key)
}

/** The `:repo` and `:number` route params, validated. */
export function pullTargetFromEvent(event: H3Event): PullTarget {
  const target = parsePullTarget(getRouterParam(event, 'repo'), getRouterParam(event, 'number'))
  if (!target) {
    throw createError({ status: 404, statusText: 'Unknown pull request' })
  }

  return target
}

/** The pages the PR adds or changes. */
export async function pullPages(preview: PullPreview): Promise<PullPreviewSummary['pages']> {
  const key = preview.instanceKey
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

  const key = preview.instanceKey
  const { prefix } = instanceSource(key).source
  if (prefix === '/') return prefix

  const content = await getInstanceAtPull(key, preview.sha)

  return firstPagePath(findByPath(await content.navigation(), prefix)?.children) ?? prefix
}

/** `items` with `nodes` inserted after the item at `path`, or at the end. */
function insertAfter(items: NavigationItem[], path: string, nodes: NavigationItem[]): NavigationItem[] {
  const at = (items.findIndex(item => item.path === path) + 1) || items.length

  return [...items.slice(0, at), ...nodes, ...items.slice(at)]
}

/**
 * `/api/navigation/:version`'s tree, read through the preview's instances.
 * Mirrors production's `docTree()` grafts, so `navigation.ts` stays preview-free.
 */
export async function pullNavigation(version: DocVersion, preview: PullPreview): Promise<NavigationItem[]> {
  const subtree = async (key: ContentInstanceKey, path: string): Promise<NavigationItem[]> => {
    const item = findByPath(await (await getInstanceForPull(preview, key)).navigation(), path)
    return item ? [item] : []
  }

  const prefix = docsPathPrefix(version)
  const [[docs], commands, examples, blog] = await Promise.all([
    subtree(docsInstanceKey(version), prefix),
    // Optional grafts, as in production: losing one keeps the rest of the tree.
    subtree(cliInstanceKey(version), cliDocsPathPrefix(version)).catch(() => []),
    subtree('examples', EXAMPLES_PATH_PREFIX).catch(() => []),
    subtree('site', '/blog').catch(() => [])
  ])

  // Examples after the API section, commands after its utils.
  const children = insertAfter(docs?.children ?? [], `${prefix}/api`, examples).map(item => item.path === `${prefix}/api`
    ? { ...item, children: insertAfter(item.children ?? [], `${prefix}/api/utils`, commands) }
    : item)

  return [{ ...(docs ?? { title: 'Docs', path: prefix }), children }, ...blog]
}
