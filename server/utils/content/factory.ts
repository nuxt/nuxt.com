import { join } from 'node:path'
import { comarkContent, type CacheOptions, type ComarkContent, type ParsedSource, type Source } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import markdown from 'comark-content/plugins/markdown'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import { comarkPlugins, instancePlugins } from './plugins'
import { instanceSource, type InstanceSource } from './instances'
import { instanceBasePath, type ContentInstanceKey } from '../../../shared/utils/content'

/**
 * The parser, in one place, for:
 * - The build-time snapshot (`modules/snapshot/`)
 * - The instance serving requests
 *
 * A body parsed with a different chain, prefix or listing fields is one the runtime cannot reuse.
 * Free of nitro auto-imports, and importing `shared/` relatively, so the module can import it.
 */

export interface SourceContext {
  /** Commit the source reads. Ignored when reading a local directory. */
  sha: string
  /** GitHub token, when one is configured. */
  token?: string
  /** Read `local` instances from the checkout's own `contentDir` instead of GitHub. */
  useLocalDir?: boolean
  /** Resolves local directories against this root; the build's cwd is not guaranteed. */
  rootDir?: string
}

/** Read `source` from a local directory, or from the repo at `ctx.sha`. */
export function createInstanceSource(source: InstanceSource, ctx: SourceContext): Source | ParsedSource {
  const overridePath = source.envOverride ? process.env[source.envOverride] : undefined
  const prefix = source.prefix === '/' ? undefined : source.prefix
  const options = { prefix, exclude: source.exclude, schema: source.schema }

  if (source.local && ctx.useLocalDir) {
    return fs(ctx.rootDir ? join(ctx.rootDir, source.contentDir) : source.contentDir, options)
  }
  if (overridePath) {
    return fs(join(overridePath, source.contentDir), options)
  }

  return github({
    repo: source.repo,
    branch: ctx.sha,
    path: source.contentDir,
    token: ctx.token,
    // `sha` is an immutable commit outside dev => we can cache hard.
    ttl: 60 * 60 * 24,
    ...options
  })
}

/**
 * The instance for `key`, reading `source`. Holds no shared state.
 *
 * `source` is passed in, not derived: the runtime wraps it with `withSnapshot()`, the build does not.
 */
export function createInstance(
  key: ContentInstanceKey,
  source: Source | ParsedSource,
  cache?: CacheOptions
): ComarkContent {
  const { name, source: definition } = instanceSource(key)

  return comarkContent(name, {
    basePath: instanceBasePath(key),
    source,
    plugins: [
      markdown({ comark: { plugins: comarkPlugins }, listingFields: definition.listingFields }),
      yaml({ listingFields: definition.listingFields }),
      json({ listingFields: definition.listingFields }),
      ...instancePlugins(key)
    ],
    cache
  })
}
