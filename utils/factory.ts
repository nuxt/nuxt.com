import { join } from 'node:path'
import { comarkContent, type CacheOptions, type ComarkContent, type ParsedSource, type Source } from 'comark-content'
import fs from 'comark-content/sources/fs'
import github from 'comark-content/sources/github'
import markdown from 'comark-content/plugins/markdown'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import tracingOtel from 'comark-content/plugins/tracing/otel'
import type { Tracer } from '@opentelemetry/api'
import { comarkPlugins, instancePlugins } from '../server/utils/content/plugins'
import { instanceSource, type InstanceSource } from '../server/utils/content/instances'
import { instanceBasePath, type ContentInstanceKey } from '../shared/utils/content'
import { contentTracer } from '../server/utils/tracer'

/**
 * The parser, in one place, for:
 * - The build-time snapshot (`modules/snapshot/`)
 * - The instance serving requests
 *
 * A body parsed with a different chain, prefix or listing fields is one the runtime cannot reuse.
 * Free of nitro auto-imports, and importing `shared/`/`server/` relatively, so the module can import it.
 */

export interface SourceContext {
  /** GitHub token, when one is configured. */
  token?: string
  /** Read `local` instances from the checkout's own `contentDir` instead of GitHub. */
  useLocalDir?: boolean
  /** Resolves local directories against this root; the build's cwd is not guaranteed. */
  rootDir?: string
}

/** Read `source` from a local directory, or from its configured branch — `withRef(sha)` pins the commit. */
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
    branch: source.branch,
    path: source.contentDir,
    token: ctx.token,
    // Reads happen through `withRef(<sha>)`, an immutable commit => cache hard.
    ttl: 60 * 60 * 24,
    ...options
  })
}

type InstanceOptions = { source: Source | ParsedSource, cache?: CacheOptions }

/**
 * The instance for `key`, reading `options.source`. Holds no shared state.
 *
 * `tracer` is only ever passed by `createRuntimeInstance()` — the build-time instance
 * (`createBuildInstance()`) is a one-shot parse, not worth tracing.
 */
function create(key: ContentInstanceKey, options: InstanceOptions, tracer?: Tracer): ComarkContent {
  const { name, source: definition } = instanceSource(key)

  return comarkContent(name, {
    basePath: instanceBasePath(key),
    source: options.source,
    plugins: [
      markdown({ comark: { plugins: comarkPlugins }, listingFields: definition.listingFields }),
      yaml({ listingFields: definition.listingFields }),
      json({ listingFields: definition.listingFields }),
      ...instancePlugins(key),
      tracer && tracingOtel({ tracer })
    ],
    cache: options.cache
  })
}

/** An instance serving requests: traced, and cached under its instance driver. */
export function createRuntimeInstance(key: ContentInstanceKey, options: InstanceOptions): ComarkContent {
  return create(key, options, contentTracer())
}

/** The throwaway instance the build-time snapshot is parsed with (`modules/snapshot/`). */
export function createBuildInstance(key: ContentInstanceKey, options: Pick<InstanceOptions, 'source'>): ComarkContent {
  return create(key, options)
}
