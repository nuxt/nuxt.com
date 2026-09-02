import { join } from 'node:path'
import { type ComarkContent, comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import markdown from 'comark-content/plugins/markdown'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import type { InstanceSource } from './instances'
import { instanceBasePath, type ContentInstanceKey } from '#shared/utils/content'

/** Read `source` from a local directory in dev, or from the repo at `sha`. */
function createSource(source: InstanceSource, sha: string) {
  const overridePath = source.envOverride ? process.env[source.envOverride] : undefined
  const prefix = source.prefix === '/' ? undefined : source.prefix

  if (source.local && import.meta.dev) {
    return fs(source.contentDir, { prefix, exclude: source.exclude, schema: source.schema })
  }
  if (overridePath) {
    return fs(join(overridePath, source.contentDir), { prefix, exclude: source.exclude, schema: source.schema })
  }
  return github({
    repo: source.repo,
    branch: sha,
    path: source.contentDir,
    prefix,
    exclude: source.exclude,
    schema: source.schema,
    token: contentGithubToken(),
    // `sha` is an immutable commit outside dev => we can cache hard.
    ttl: 60 * 60 * 24
  })
}

/**
 * Create the content instance for `key`, reading its source at `sha`. Holds no shared state.
 */
export async function createContentInstance(key: ContentInstanceKey, sha: string): Promise<ComarkContent> {
  const { name, source } = instanceSource(key)

  return comarkContent({
    basePath: instanceBasePath(key),
    sources: { [name]: createSource(source, sha) },
    plugins: [
      markdown({ comark: { plugins: comarkPlugins }, listingFields: source.listingFields }),
      yaml({ listingFields: source.listingFields }),
      json({ listingFields: source.listingFields }),
      ...instancePlugins(key)
    ],
    cache: { driver: contentCacheDriver(key, sha) }
  })
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

  const instance = createContentInstance(key, sha).catch((error) => {
    // Don't memoize a failed build: the next request should retry.
    if (instances.get(key)?.sha === sha) instances.delete(key)
    throw error
  })
  instances.set(key, { sha, instance })

  return instance
}

/**
 * Warm up the artifacts.
 * - manifest artifact
 * - snapshot artifact (only if `opts.snapshot` is true)
 */
export async function warmArtifacts(content: ComarkContent, opts: { snapshot?: boolean } = {}): Promise<void> {
  await content.init({ partial: false })
  if (!opts.snapshot) return

  for (const source of content.manifest.sources) {
    let artifact = await content.cache.snapshot(source)
    if (!artifact) {
      artifact = await content.cache.snapshot(source, { fresh: true })
    }

    if (!artifact) {
      console.warn(`[content] no snapshot artifact produced for source "${source}"`)
    }
  }
}
