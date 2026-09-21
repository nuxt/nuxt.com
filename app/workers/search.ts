/**
 * Search worker: owns the browser-standalone `comark-content` hub (sqlite-wasm FTS5) hydrated from
 * several instances' per-commit snapshot artifacts (docs, its command reference, and examples).
 */
import { comarkContent, contentHub, readArtifact } from 'comark-content/runtime'
import sqliteWasm from 'comark-content/database/sqlite-wasm'
import snapshot from 'comark-content/sources/snapshot'
import sqliteFullTextSearch from 'comark-content/plugins/sqlite-full-text-search'
import { ofetch } from 'ofetch'
import { describeArtifact, indexedRows, isDebug, log, logger, setDebug, since } from './internal/search-logger'
import type { AnyComarkContent, CacheArtifact, ContentHub, SearchOptions, SearchResult } from 'comark-content/runtime'

/** One instance the palette searches: an instance name and the base its artifacts are pinned under. */
export interface SearchTarget {
  name: string
  base: string
}

/** Identifies a set of targets: order and content both matter, a stale sha in one member changes it. */
const targetsKey = (targets: SearchTarget[]): string => targets.map(target => `${target.name}@${target.base}`).join('|')

/**
 * The hub currently searchable, and the target set it was built from.
 *
 * One at a time on purpose: a target's `base` carries both the docs version and its commit, so
 * switching version or a push replaces the whole hub.
 */
let active: { key: string, hub: ContentHub<AnyComarkContent[]> } | undefined

/**
 * The in-flight hydration, keyed by the target set it targets.
 */
let hydration: { key: string, promise: Promise<void> } | undefined

/**
 * Loads the database for `targets`. No-op once ready for that set; retries after a failure.
 */
export function warmupSearch(targets: SearchTarget[], origin: string, debug: boolean): Promise<void> {
  setDebug(debug)
  if (!targets.length) {
    return Promise.reject(new Error('[search] cannot build a database without at least one target'))
  }

  const key = targetsKey(targets)
  if (active?.key === key) {
    log(`warmup ignored — already ready for ${key}`)
    return Promise.resolve()
  }
  if (hydration?.key === key) return hydration.promise

  const promise = loadDatabase(key, targets, origin).catch((error) => {
    hydration = undefined // clears the guard so the next warmup can retry
    throw error
  })
  hydration = { key, promise }
  return promise
}

async function loadDatabase(key: string, targets: SearchTarget[], origin: string): Promise<void> {
  const started = performance.now()
  try {
    const fetchArtifact = async (path: string): Promise<CacheArtifact> => {
      const url = new URL(path, origin).href
      const fetchStarted = performance.now()
      try {
        const artifact = await ofetch<CacheArtifact>(url)
        if (isDebug()) {
          let contents: string
          try {
            contents = describeArtifact(await readArtifact(artifact))
          } catch (error) {
            contents = `undecodable: ${error instanceof Error ? error.message : String(error)}`
          }
          log(`fetched ${path} in ${since(fetchStarted)} — ${artifact?.size ?? 0} bytes, ${contents}`)
        }
        return artifact
      } catch (error) {
        log(`failed ${path} after ${since(fetchStarted)}`, error)
        throw error
      }
    }

    // One database, shared by every target: the FTS plugin needs it to rank across instances in a
    // single query — see comark-content's full-text-search plugin, "shared database".
    const database = sqliteWasm()

    // Hydrated independently: one target's stale pin (a push rotated its sha mid-session) must not
    // sink the others. Only if every target fails does warmup itself fail.
    const settledContents = await Promise.allSettled(targets.map(async (target) => {
      const content = comarkContent(target.name, {
        source: snapshot(
          () => fetchArtifact(`${target.base}/snapshot/${target.name}.json`),
          () => fetchArtifact(`${target.base}/manifest.json`)
        ),
        plugins: [sqliteFullTextSearch({ database })],
        logger
      })
      await content.init()
      return content
    }))

    const hydratedContents: AnyComarkContent[] = []
    for (const [index, result] of settledContents.entries()) {
      const target = targets[index]!
      if (result.status === 'fulfilled') {
        hydratedContents.push(result.value)
      } else {
        log(`hydration failed for "${target.name}" (${target.base})`, result.reason)
      }
    }

    if (!hydratedContents.length) {
      throw new Error(`[search] every target failed to hydrate (${targets.map(target => target.name).join(', ')})`)
    }

    const hub = contentHub(hydratedContents, { logger })

    const indexStarted = performance.now()
    await hub.search('') // pulls every instance in and builds the shared FTS index
    const rows = await Promise.all(hydratedContents.map(async instance => `${instance.name}=${await indexedRows(database, instance.name)}`))
    log(`index built in ${since(indexStarted)} — ${rows.join(', ')}`)

    active = { key, hub }
    log(`ready in ${since(started)} (${hydratedContents.length}/${targets.length} instance(s))`)
  } catch (error) {
    log(`hydration failed after ${since(started)}`, error)
    throw error
  }
}

/** Empty until hydration lands. */
export async function searchContent(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
  if (!active) {
    log(`dropped query "${query}" — no instance yet`)
    return []
  }
  const queryStarted = performance.now()
  const results = await active.hub.search(query, {
    limit: 25,
    snippet: { columns: ['content'] },
    ...opts
  })
  log(`query "${query}" -> ${results.length} result(s) in ${since(queryStarted)}`)
  return results
}
