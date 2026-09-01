import { verify } from '@octokit/webhooks-methods'
import { waitUntil } from '@vercel/functions'
import type { ComarkContent, ContentListFile } from 'comark-content'
import type { GitHubPushPayload } from '../types/github'
import type { ContentChanges } from '../utils/content/webhook'

/**
 * Content push webhook: purge exactly the URLs a commit changed.
 *
 * Registered on every repo (`nuxt/nuxt.com`, `nuxt/nuxt`, `nuxt/examples`, `nuxt/cli`).
 */

/** Each purge re-enters this deployment, so the ceiling is about not stampeding ourselves. */
const REVALIDATE_CONCURRENCY = 8

/** Why a route was purged — one value per `addPath` call site below. */
type PurgeReason = 'page' | 'payload' | 'raw' | 'nav' | 'linked' | 'global'

/** Display/response order. */
const REASON_ORDER: PurgeReason[] = ['page', 'payload', 'raw', 'nav', 'linked', 'global']

/** `nav` is the only unbounded reason (a whole instance can be thousands of pages) — cap what the log prints. */
const MAX_LOGGED_PATHS_PER_REASON = 5

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).webhookSecret || process.env.WEBHOOK_SECRET
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN

  if (!secret || !bypassToken) {
    throw createError({ statusCode: 501, statusMessage: 'Revalidation webhook is not configured' })
  }

  const signature = getHeader(event, 'x-hub-signature-256')
  if (!signature) {
    throw createError({ statusCode: 401, statusMessage: 'Missing signature' })
  }

  const raw = await readRawBody(event, 'utf8')
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }
  if (!(await verify(secret, raw, signature))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const requestId = getHeader(event, 'x-vercel-id') ?? getHeader(event, 'x-request-id') ?? 'local'
  const deliveryId = getHeader(event, 'x-github-delivery')
  const tag = `[revalidate:${requestId}${deliveryId ? `:${deliveryId}` : ''}]`
  const timings = createTimings()

  const githubEvent = getHeader(event, 'x-github-event')
  if (githubEvent !== 'push') {
    console.log(`${tag} skipped: ${githubEvent ?? 'unknown'} event`)
    return { ok: true, skipped: 'not-a-push-event', event: githubEvent }
  }

  const payload = JSON.parse(raw) as GitHubPushPayload
  const repo = payload.repository?.full_name
  const branch = payload.ref?.startsWith('refs/heads/') ? payload.ref.slice('refs/heads/'.length) : undefined

  if (!repo || !branch) {
    return { ok: true, skipped: 'not-a-branch-push', ref: payload.ref }
  }

  // One push can feed several instances (docs or cli versions).
  const impacted = impactedInstances(repo, branch)
  if (!impacted.length) {
    return { ok: true, skipped: 'no-source-reads-this-ref', repo, branch }
  }

  const changesByInstance = new Map<ContentInstanceKey, ContentChanges>()
  for (const key of impacted) {
    const { name, source } = instanceSource(key)
    const changes = changesForSource(name, source.contentDir, payload.commits ?? [])

    if (changes.upserted.length || changes.removed.length || changes.navTouched) {
      changesByInstance.set(key, changes)
    }
  }

  if (!changesByInstance.size) {
    return { ok: true, skipped: 'no-content-changes', repo, branch }
  }

  const pathsToPurge = new Set<string>()
  const pathsByScope = new Map<string, Map<PurgeReason, Set<string>>>()
  const summary: Record<string, { pages: string[], navChanged: boolean }> = {}
  const buildId = useRuntimeConfig(event).app.buildId

  /** Add a path to the purge set, and track it by scope and reason. */
  const addPath = (scope: string, reason: PurgeReason, path: string): void => {
    if (pathsToPurge.has(path)) return
    pathsToPurge.add(path)
    const byReason = pathsByScope.get(scope) ?? new Map<PurgeReason, Set<string>>()
    const paths = byReason.get(reason) ?? new Set<string>()
    paths.add(path)
    byReason.set(reason, paths)
    pathsByScope.set(scope, byReason)
  }

  const rebuiltInstances = new Map<ContentInstanceKey, ComarkContent>()

  for (const [instanceKey, changes] of changesByInstance) {
    const { newItems, pagePaths, navChanged } = await timings.time(`rebuild:${instanceKey}`, async () => {
      const outdatedInstance = await getInstanceAtHead(instanceKey)
      await outdatedInstance.init()

      const outdatedItems = { ...outdatedInstance.manifest.items }

      const headSha = await resolveInstanceSha(instanceKey, { refresh: true })
      const newInstance = await createContentInstance(instanceKey, headSha)
      await newInstance.init()

      rebuiltInstances.set(instanceKey, newInstance)

      const newItems = newInstance.manifest.items
      return { newItems, ...diffInstance(changes, outdatedItems, newItems) }
    })

    // Live `/api/content/<instance>/…` routes have no ISR rule, so there is nothing cached to purge.
    for (const path of pagePaths) {
      addPath(instanceKey, 'page', path)
      addPath(instanceKey, 'payload', payloadUrlForPage(path, buildId))
      addPath(instanceKey, 'raw', rawUrlForPage(path))
    }

    // Navigation renders on every page of the instance, so a change re-renders all of them.
    if (navChanged || changes.navTouched) {
      addPath(instanceKey, 'nav', '/api/navigation.json')
      for (const item of Object.values(newItems)) {
        if (item.meta.kind !== 'document') continue
        addPath(instanceKey, 'nav', item.path)
        addPath(instanceKey, 'nav', payloadUrlForPage(item.path, buildId))
        addPath(instanceKey, 'nav', rawUrlForPage(item.path))
      }
    }

    // `/` and `/showcase` embed each other's content, so either changing purges both.
    if (pagePaths.includes('/') || pagePaths.includes('/showcase')) {
      for (const path of ['/', '/showcase']) {
        addPath(instanceKey, 'linked', path)
        addPath(instanceKey, 'linked', payloadUrlForPage(path, buildId))
      }
    }

    summary[instanceKey] = { pages: pagePaths, navChanged: navChanged || changes.navTouched }
  }

  // Invalidate global indexes: each is rebuilt from every instance, so any change invalidates them.
  for (const path of ['/llms.txt', '/llms-full.txt', '/sitemap.xml', '/sitemap.md', '/blog/rss.xml', '/design.md']) {
    addPath('global', 'global', path)
  }

  console.log(`${tag} ${repo}@${branch} → ${JSON.stringify(summary)} | ${pathsToPurge.size} route(s) | ${timings.format()}`)
  logBreakdown(tag, pathsByScope)

  // Dev has no ISR cache to purge, and a nav-wide change here is ~1000 local SSR renders against
  // a dev server, not a purge.
  if (import.meta.dev) {
    return { ok: true, requestId, delivery: deliveryId, repo, branch, instances: summary, routes: routesBreakdown(pathsByScope), dev: true }
  }

  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  const headers: Record<string, string> = {
    // Purges the ISR entry for the URL being fetched.
    'x-prerender-revalidate': bypassToken
  }
  // Lets the deployment call itself while Vercel Authentication is on (preview deploys).
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  // Vercel's `waitUntil`, not Nitro's `event.waitUntil`, which can orphan the work here.
  waitUntil((async () => {
    await timings.time('warm', async () => {
      for (const [instance, content] of rebuiltInstances) {
        await warmSnapshot(content).catch((error) => {
          console.error(`${tag} snapshot warm failed for ${instance}`, error?.message ?? error)
        })
      }
    })

    let absent = 0
    const results = await timings.time('purge', () => settleInBatches([...pathsToPurge], REVALIDATE_CONCURRENCY, path =>
      $fetch(path, { baseURL, method: 'GET', headers }).catch((error) => {
        // Not every content file has an HTML page — `content/design.md` is served only as markdown,
        // at `/design.md`. A 404 means there was nothing cached to purge, which is the goal anyway.
        if (error?.statusCode === 404) {
          absent += 1
          return
        }
        console.error(`${tag}   ✗ ${path}`, error?.statusCode ?? error?.message ?? error)
        throw error
      })
    ))

    const failed = results.filter(result => result.status === 'rejected').length
    console.log(`${tag} complete: ${results.length - failed - absent} purged, ${absent} absent, ${failed} failed | ${timings.format()} | total=${timings.since()}ms`)
  })())

  return {
    ok: true,
    requestId,
    deliveryId,
    repo,
    branch,
    instances: summary,
    routes: routesBreakdown(pathsByScope)
  }
})

/** One log line per purged path, grouped by scope then reason */
function logBreakdown(tag: string, pathsByScope: Map<string, Map<PurgeReason, Set<string>>>): void {
  for (const [scope, byReason] of pathsByScope) {
    const total = [...byReason.values()].reduce((sum, paths) => sum + paths.size, 0)
    console.log(`${tag}   ${scope} (${total})`)

    for (const reason of REASON_ORDER) {
      const paths = byReason.get(reason)
      if (!paths?.size) continue

      const sorted = [...paths].sort()
      for (const path of sorted.slice(0, MAX_LOGGED_PATHS_PER_REASON)) {
        console.log(`${tag}     ${reason}\t${path}`)
      }
      if (sorted.length > MAX_LOGGED_PATHS_PER_REASON) {
        console.log(`${tag}     ${reason}\t...`)
      }
    }
  }
}

/** Route counts by reason, aggregated across every scope */
function routesBreakdown(pathsByScope: Map<string, Map<PurgeReason, Set<string>>>): { total: number } & Partial<Record<PurgeReason, number>> {
  const byReason: Partial<Record<PurgeReason, number>> = {}

  for (const scoped of pathsByScope.values()) {
    for (const [reason, paths] of scoped) {
      byReason[reason] = (byReason[reason] ?? 0) + paths.size
    }
  }

  const total = Object.values(byReason).reduce((sum, count) => sum + (count ?? 0), 0)
  return { total, ...byReason }
}

/**
 * Which pages a push changed, and whether the tree itself moved.
 */
function diffInstance(
  changes: ContentChanges,
  before: Record<string, ContentListFile> | null,
  after: Record<string, ContentListFile>
): { pagePaths: string[], navChanged: boolean } {
  const pagePaths = new Set<string>()

  // The manifest is keyed by page path; `meta.key` is the `<source>/<stem><ext>` a changed file maps
  // to. Indexing by it is what lets comark own the file → URL derivation.
  const afterByKey = indexByFileKey(after)
  const beforeByKey = before ? indexByFileKey(before) : null

  for (const key of changes.upserted) {
    const path = afterByKey.get(key)
    if (path) pagePaths.add(path)
  }
  for (const key of changes.removed) {
    const path = beforeByKey?.get(key)
    if (path) pagePaths.add(path)
  }

  // Without a previous manifest, assume the tree moved: purging every page of the instance is
  // wasteful but correct, and serving a stale navigation is not.
  if (!before) return { pagePaths: [...pagePaths], navChanged: true }

  const beforeKeys = Object.keys(before)
  const afterKeys = Object.keys(after)
  const navChanged = beforeKeys.length !== afterKeys.length
    || afterKeys.some(key => !before[key])
    // Listing fields (title, description, icon, `navigation`) are what the tree renders from.
    || afterKeys.some(key => before[key] && !sameListing(before[key]!, after[key]!))

  return { pagePaths: [...pagePaths], navChanged }
}

/** `<source>/<stem><ext>` → page path, the reverse of what the path-keyed manifest gives. */
function indexByFileKey(items: Record<string, ContentListFile>): Map<string, string> {
  const index = new Map<string, string>()
  for (const item of Object.values(items)) index.set(item.meta.key, item.path)

  return index
}

function sameListing(a: ContentListFile, b: ContentListFile): boolean {
  return a.path === b.path && JSON.stringify(a.data) === JSON.stringify(b.data)
}

/** `Promise.allSettled` over `items`, at most `size` in flight. */
async function settleInBatches<T>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<unknown>
): Promise<PromiseSettledResult<unknown>[]> {
  const results: PromiseSettledResult<unknown>[] = []

  for (let index = 0; index < items.length; index += size) {
    // Not `.map(fn)` — `map` passes the index, which would land in a callee's optional parameter.
    results.push(...await Promise.allSettled(items.slice(index, index + size).map(item => fn(item))))
  }

  return results
}
