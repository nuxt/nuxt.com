import type { H3Event } from 'h3'
import { rawUrl, useAgentDiscoveryConfig } from '#agent-discovery'
import type { GitHubPushCommit } from '../../types/github'
import { CONTENT_INSTANCE_KEYS } from '#shared/utils/content'

/** How a push changed one source's files, already filtered to that source's `contentDir`. */
export interface ContentChanges {
  /** Manifest keys (`<source>/<stem><ext>`) of files added or modified. */
  upserted: string[]
  /** Manifest keys of files removed — only the previous manifest can resolve their paths. */
  removed: string[]
  /** A `.navigation.*` file changed, so the tree changed regardless of which pages did. */
  navTouched: boolean
}

/** Files a content source can actually serve. */
const CONTENT_EXTENSIONS = ['.md', '.yml', '.yaml', '.json']

/**
 * Every instance reading `repo` at `branch`.
 */
export function impactedInstances(repo: string, branch: string): ContentInstanceKey[] {
  return CONTENT_INSTANCE_KEYS.filter((key) => {
    const { source } = instanceSource(key)
    return source.repo === repo && source.branch === branch
  })
}

/**
 * A push's changed files for one source, named `sourceName` and reading `contentDir`
 * (see `instanceSource()`).
 */
export function changesForSource(sourceName: string, contentDir: string, commits: GitHubPushCommit[]): ContentChanges {
  const upserted = new Set<string>()
  const removed = new Set<string>()
  let navTouched = false

  const consider = (file: string, into: Set<string>) => {
    const key = manifestKeyFor(file, sourceName, contentDir)
    if (!key) return

    if (isNavConfig(file)) navTouched = true
    else into.add(key)
  }

  for (const commit of commits) {
    for (const file of commit.added ?? []) consider(file, upserted)
    for (const file of commit.modified ?? []) consider(file, upserted)
    for (const file of commit.removed ?? []) consider(file, removed)
  }

  // A path removed and re-added in the same push is an upsert, not a removal.
  for (const key of upserted) removed.delete(key)

  return { upserted: [...upserted], removed: [...removed], navTouched }
}

/**
 * Repo-relative path → the key it has in this source's manifest, or `null` when the source cannot
 * serve it (outside `contentDir`, or not a content extension).
 */
function manifestKeyFor(file: string, sourceName: string, contentDir: string): string | null {
  const dir = contentDir.replace(/^\/+|\/+$/g, '')
  const prefix = dir ? `${dir}/` : ''

  if (prefix && !file.startsWith(prefix)) return null
  if (!CONTENT_EXTENSIONS.some(extension => file.endsWith(extension))) return null

  return `${sourceName}/${file.slice(prefix.length)}`
}

/** Directory configuration (`.navigation.yml`), which contributes to the tree rather than a page. */
function isNavConfig(file: string): boolean {
  return file.split('/').pop()!.startsWith('.navigation')
}

/**
 * The payload URL a client-side navigation fetches for `path`.
 *
 * `experimental.payloadExtraction` is on, so every ISR page has a second cache entry holding its
 * data. Purging only the HTML leaves that stale, and a visitor navigating in-app would keep seeing
 * the old content — the shape is Nuxt's: `<path>/_payload.json?_b=<buildId>`.
 */
export function payloadUrlForPage(path: string, buildId: string): string {
  const base = path === '/' ? '/_payload.json' : `${path.replace(/\/$/, '')}/_payload.json`

  return buildId ? `${base}?_b=${buildId}` : base
}

/**
 * Page path -> raw markdown URL, or `undefined` when the page has no markdown twin.
 */
export function rawUrlForPage(event: H3Event, path: string): string | undefined {
  const resolved = new URL(rawUrl(event, path)).pathname
  const { rawPrefix } = useAgentDiscoveryConfig(event)

  return resolved === rawPrefix || resolved.startsWith(`${rawPrefix}/`) ? resolved : undefined
}
