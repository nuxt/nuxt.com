import type { ComarkContent, ParsedSource, Source } from 'comark-content'
import { withSnapshot } from 'comark-content/sources/snapshot'
import { createInstanceSource, createRuntimeInstance } from '../../../utils/factory'
import { hasBuildSnapshot, instanceSnapshotDir, SNAPSHOT_ASSET_BASE } from './snapshot'
import type { ContentInstanceKey } from '#shared/utils/content'

const assets = () => useStorage(`assets:${SNAPSHOT_ASSET_BASE}`)

/**
 * Read one artifact `modules/snapshot/` wrote into the function bundle.
 *
 * Untyped: unstorage runs every value through `destr`, so this arrives already parsed.
 * A deployment that shipped no snapshot has no asset, and `null` sends comark to the origin.
 * A read that *fails* is a bug, but not one worth failing the instance over.
 */
async function readArtifact(key: ContentInstanceKey, name: string, file: string): Promise<unknown> {
  const startedAt = performance.now()
  const data = await assets().get(`${instanceSnapshotDir(key)}/${name}/${file}`).catch((error) => {
    console.error(`[content] could not read ${key}'s ${file} — falling back to the content repository`, error)
    return null
  })

  recordDuration(`content.${file.replace('.json', '')}.read.ms`, startedAt, {
    instance: key,
    hit: String(data != null)
  })

  return data
}

/**
 * The source `key` reads, wrapped with the build snapshot when this deployment ships one.
 * Unpinned: `withRef(sha)` on the instance built from it pins the commit.
 *
 * The raw source stays the authority: per-file reads, `refresh()` and `watch()` all go to it.
 * The snapshot only wins at init, and only for bodies whose source hash still matches.
 */
function instanceSourceFor(key: ContentInstanceKey): Source | ParsedSource {
  const { name, source } = instanceSource(key)
  const raw = createInstanceSource(source, {
    token: contentGithubToken(),
    useLocalDir: import.meta.dev
  })

  // Dev reads the working tree, which `watch()` follows: no snapshot exists, and none would help.
  if (import.meta.dev || !hasBuildSnapshot(key)) return raw

  // Full snapshot first, then the body-free index that lets a cold start skip downloading bodies.
  return withSnapshot(
    raw,
    () => readArtifact(key, name, 'snapshot.json'),
    () => readArtifact(key, name, 'manifest.json')
  )
}

/**
 * Unpinned base per instance: owns its source, plugin chain and cache driver.
 * Every commit-pinned instance derives from it with `withRef(sha)`, sharing its driver.
 */
const bases = new Map<ContentInstanceKey, ComarkContent>()

function getBaseInstance(key: ContentInstanceKey): ComarkContent {
  let base = bases.get(key)
  if (!base) {
    base = createRuntimeInstance(key, {
      source: instanceSourceFor(key),
      cache: { driver: contentCacheDriver(key) }
    })
    bases.set(key, base)
  }
  return base
}

/**
 * The instance for `key`, pinned to `sha`. Holds no state of its own beyond the base it derives from.
 */
export function contentInstanceAt(key: ContentInstanceKey, sha: string): ComarkContent {
  return getBaseInstance(key).withRef(sha)
}

/**
 * Live instances, keyed by `ContentInstanceKey`.
 * Holds the *promise*, not the instance (assignment lands after the await to avoid race conditions).
 */
const instances = new Map<ContentInstanceKey, { sha: string, instance: Promise<ComarkContent> }>()

/**
 * The instance serving `key`, for the lifetime of this server instance.
 * Each call resolves that instance's latest commit.
 */
export async function getInstanceAtHead(key: ContentInstanceKey): Promise<ComarkContent> {
  const sha = await resolveInstanceSha(key)
  const current = instances.get(key)

  if (current?.sha === sha) {
    return current.instance
  }

  const instance = (async () => {
    const created = import.meta.dev ? await watchedDevInstance(key) : contentInstanceAt(key, sha)
    const startedAt = performance.now()
    await created.init()
    recordDuration('content.init.ms', startedAt, { instance: key })
    return created
  })().catch((error) => {
    // Don't memoize a failed build: the next request should retry.
    if (instances.get(key)?.sha === sha) instances.delete(key)
    throw error
  })
  instances.set(key, { sha, instance })

  // Release the superseded instance's database and watchers
  if (current) void current.instance.then(previous => previous.dispose()).catch(() => {})

  return instance
}

/** Dev serves the unpinned base directly: its source is the working tree, which `watch()` follows. */
async function watchedDevInstance(key: ContentInstanceKey): Promise<ComarkContent> {
  const base = getBaseInstance(key)
  await base.watch()
  base.hooks.hook('watch:file:update', (_source: string, fileKey: string) => console.log(`[content] ${key} ${fileKey} updated`))
  return base
}

/**
 * Parse every file, so the artifacts fetched next are served from a warm index.
 */
export async function warmInstance(content: ComarkContent): Promise<void> {
  const startedAt = performance.now()
  await content.init({ partial: false })
  recordDuration('content.warm.ms', startedAt, { instance: content.name })
}
