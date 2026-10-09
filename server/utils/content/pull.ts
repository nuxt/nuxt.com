import { createStorage } from 'unstorage'
import type { H3Event } from 'h3'
import type { ComarkContent, NavigationItem } from 'comark-content'
import type { PullPreviewSummary } from '#shared/types'
import { cliDocsPathPrefix } from '#shared/utils/cli'
import { CONTENT_INSTANCE_KEYS, cliInstanceKey, docsInstanceKey, type ContentInstanceKey } from '#shared/utils/content'
import { docsPathPrefix, EXAMPLES_PATH_PREFIX, type DocVersion } from '#shared/utils/docs'
import { isPullContentPage, parsePullTarget, pullRepoName, type PullTarget } from '#shared/utils/pull'
import { createRuntimeInstance } from '../../../utils/factory'

/** Label a maintainer adds to a PR to make it previewable. */
export const PULL_PREVIEW_LABEL = 'preview:enabled'

/** A preview follows new pushes, and a removed label revokes it, within this bound. */
const PULL_TTL = 600

/** A PR labelled or opened since the list was fetched refreshes it, at most this often. */
const PULL_REFRESH_COOLDOWN = 60

/** Open PRs listed per repo, 100 per page: older ones past that aren't previewable. */
const MAX_PULL_PAGES = 5

/** A PR's files only change with its head commit. */
const PULL_FILES_TTL = 60 * 60 * 24

/** GitHub lists at most 3000 files per PR, 100 per page. */
const MAX_FILE_PAGES = 30

const pullStorage = createStorage({ driver: githubRefCacheDriver(PULL_TTL) })

export interface PullPreview {
  target: PullTarget
  title: string
  url: string
  /** The PR's head commit. */
  sha: string
  /** The instance the PR replaces, read at `sha`. */
  instanceKey: ContentInstanceKey
  /** Files the PR adds, modifies or removes. */
  files: PullFile[]
}

/** A file a PR changes. */
export interface PullFile {
  path: string
  /** Deleted by the PR: only production still has it. */
  removed: boolean
}

/** What the cached list keeps of a previewable PR. */
interface PreviewablePull {
  title: string
  url: string
  sha: string
  /** The instance the PR replaces. */
  instanceKey: ContentInstanceKey
}

interface PreviewablePulls {
  fetchedAt: number
  /** Every open PR number, previewable or not. */
  open: number[]
  pulls: Record<number, PreviewablePull>
}

interface GitHubPull {
  number: number
  title: string
  html_url: string
  head: { sha: string }
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

/** Lists every open PR, but keeps only the ones nuxt.com may preview. */
async function fetchPreviewablePulls(repo: string): Promise<PreviewablePulls> {
  const pulls: Record<number, PreviewablePull> = {}
  const open: number[] = []

  for (let page = 1; page <= MAX_PULL_PAGES; page++) {
    const batch = await $fetch<GitHubPull[]>(`https://api.github.com/repos/${repo}/pulls`, {
      headers: githubHeaders(),
      query: { state: 'open', per_page: 100, page }
    }).catch((error) => {
      throw createError({ status: 502, statusText: 'Could not reach GitHub', cause: error })
    })

    for (const pull of batch) {
      open.push(pull.number)

      const instanceKey = pullInstanceKey(repo, pull.base.ref)
      // Same-repo PRs need the label too: rendering a PR on nuxt.com is a maintainer's call.
      const isPreviewEnabled = pull.labels.some(label => label.name === PULL_PREVIEW_LABEL)
      if (!instanceKey || !isPreviewEnabled) continue

      pulls[pull.number] = { title: pull.title, url: pull.html_url, sha: pull.head.sha, instanceKey }
    }
    if (batch.length < 100) break
  }

  return { fetchedAt: Date.now(), open, pulls }
}

/** List fetches in flight, so a burst of requests shares one. */
const pullListFetches = new Map<string, Promise<PreviewablePulls>>()

/**
 * Return PR `number` if nuxt.com may preview it:
 * - The PR is open
 * - The PR is against a branch nuxt.com reads
 * - The PR has the `preview:enabled` label
 */
async function getPreviewablePull(repo: string, number: number): Promise<PreviewablePull | undefined> {
  const key = `pull-list:${repo}`
  const cached = await pullStorage.getItem<PreviewablePulls>(key)
  if (cached) {
    const age = Date.now() - cached.fetchedAt
    // An open PR the list can't preview may have been labelled since, a number above them all opened since.
    const mayHaveChanged = !(number in cached.pulls) && (cached.open.includes(number) || number > Math.max(0, ...cached.open))
    if (age < PULL_TTL * 1000 && (!mayHaveChanged || age < PULL_REFRESH_COOLDOWN * 1000)) return cached.pulls[number]
  }

  let fetching = pullListFetches.get(repo)
  if (!fetching) {
    fetching = fetchPreviewablePulls(repo)
      .then(async (list) => {
        await pullStorage.setItem(key, list, { ttl: PULL_TTL })
        return list
      })
      .finally(() => pullListFetches.delete(repo))
    pullListFetches.set(repo, fetching)
  }

  return (await fetching).pulls[number]
}

/** Files the PR adds, modifies or removes at its head commit. */
async function getPullFiles(repo: string, number: number, pull: PreviewablePull): Promise<PullFile[]> {
  const key = `pull-changes:${repo}:${number}:${pull.instanceKey}:${pull.sha}`
  const cached = await pullStorage.getItem<PullFile[]>(key)
  if (cached) return cached

  const files: PullFile[] = []
  for (let page = 1; page <= MAX_FILE_PAGES; page++) {
    const batch = await $fetch<Array<{ filename: string, status: string }>>(`https://api.github.com/repos/${repo}/pulls/${number}/files`, {
      headers: githubHeaders(),
      query: { per_page: 100, page }
    }).catch((error) => {
      throw createError({ status: 502, statusText: 'Could not reach GitHub', cause: error })
    })

    files.push(...batch.map(file => ({ path: file.filename, removed: file.status === 'removed' })))
    if (batch.length < 100) break
  }
  await pullStorage.setItem(key, files, { ttl: PULL_FILES_TTL })

  return files
}

/** Where `key`'s content lives in its repo, with a trailing slash: `docs/`. */
function instanceContentDir(key: ContentInstanceKey): string {
  return `${instanceSource(key).source.contentDir.replace(/\/+$/, '')}/`
}

/** The PR behind `target`, or a 404 when it isn't open, changes no content, or nuxt.com may not preview it. */
export async function resolvePullPreview(target: PullTarget): Promise<PullPreview> {
  const repo = pullRepoName(target.repo)
  const notFound = () => createError({ status: 404, statusText: `No preview available for ${repo}#${target.number}` })

  const pull = await getPreviewablePull(repo, target.number)
  if (!pull) throw notFound()

  const files = await getPullFiles(repo, target.number, pull)
  const dir = instanceContentDir(pull.instanceKey)
  if (!files.some(file => file.path.startsWith(dir))) throw notFound()

  return {
    target,
    title: pull.title,
    url: pull.url,
    sha: pull.sha,
    instanceKey: pull.instanceKey,
    files
  }
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

/**
 * The previewed page an entry appears on: its own path, or, for an entry without a route (a template card), the page listing it.
 * `undefined` for an entry no page shows (`/design`).
 */
function previewedPage(path: string): string | undefined {
  for (let page = path; page !== '/'; page = page.slice(0, page.lastIndexOf('/')) || '/') {
    if (isPullContentPage(page)) return page
  }

  return path === '/' ? path : undefined
}

/** The pages the PR adds, changes or removes; a removed page is read from production, the PR's commit no longer has it. */
export async function pullPages(preview: PullPreview): Promise<PullPreviewSummary['pages']> {
  const dir = instanceContentDir(preview.instanceKey)
  const files = preview.files.filter(file => file.path.startsWith(dir))
  const [content, production] = await Promise.all([
    getInstanceAtPull(preview.instanceKey, preview.sha),
    files.some(file => file.removed) ? getInstanceAtHead(preview.instanceKey) : undefined
  ])

  return files.flatMap((file) => {
    const entry = (file.removed ? production : content)?.stat(file.path.slice(dir.length))
    if (!entry?.path) return []

    // A data entry links to the listing showing it
    const page = previewedPage(entry.path)
    if (!page) return []

    return [{ title: String(entry.data?.title || entry.path), path: page, removed: file.removed }]
  })
}

function firstPagePath(items: NavigationItem[] | undefined): string | undefined {
  const first = items?.[0]
  if (!first) return

  return first.children?.length ? firstPagePath(first.children) : first.path
}

/** Where `/pull/:repo/:number` lands: the first changed page it still has, else the first page the PR's instance serves. */
export async function pullLandingPath(preview: PullPreview): Promise<string> {
  const page = (await pullPages(preview)).find(page => !page.removed)
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
