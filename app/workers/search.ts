/**
 * Search worker: owns the browser-standalone `comark-content` instance (sqlite-wasm FTS5) hydrated from the per-commit snapshot artifacts.
 */
import { comarkContent, readArtifact } from 'comark-content/runtime'
import sqliteWasm from 'comark-content/database/sqlite-wasm'
import snapshot from 'comark-content/sources/snapshot'
import sqliteFullTextSearch from 'comark-content/plugins/sqlite-full-text-search'
import { ofetch } from 'ofetch'
import { describeArtifact, indexedRows, isDebug, log, logger, setDebug, since } from './internal/search-logger'
import type { CacheArtifact, SearchOptions, SearchResult } from 'comark-content/runtime'

/**
 * Creates a search instance.
 */
function createSearchInstance(source: string, apiBase: string, fetchArtifact: (path: string) => Promise<CacheArtifact>) {
  const database = sqliteWasm()
  return {
    database,
    content: comarkContent(source, {
      source: snapshot(
        () => fetchArtifact(`${apiBase}/snapshot/${source}.json`),
        () => fetchArtifact(`${apiBase}/manifest.json`)
      ),
      plugins: [sqliteFullTextSearch({ database })],
      logger
    })
  }
}

type SearchInstance = ReturnType<typeof createSearchInstance>['content']

/**
 * The instance currently searchable, and the artifact root it was built from.
 *
 * One at a time on purpose: `apiBase` carries both the docs version and its commit, so switching
 * version or a push replaces it.
 */
let active: { apiBase: string, instance: SearchInstance } | undefined

/**
 * The in-flight hydration, keyed by the `apiBase` it targets.
 */
let hydration: { apiBase: string, promise: Promise<void> } | undefined

/**
 * Loads the database for `apiBase`. No-op once ready for that base; retries after a failure.
 */
export function warmupSearch(apiBase: string, source: string, origin: string, debug: boolean): Promise<void> {
  setDebug(debug)
  if (!source) {
    return Promise.reject(new Error('[search] cannot build a database without a source name'))
  }
  if (active?.apiBase === apiBase) {
    log(`warmup ignored — already ready for ${apiBase}`)
    return Promise.resolve()
  }
  if (hydration?.apiBase === apiBase) return hydration.promise

  const promise = loadDatabase(apiBase, source, origin).catch((error) => {
    hydration = undefined // clears the guard so the next warmup can retry
    throw error
  })
  hydration = { apiBase, promise }
  return promise
}

async function loadDatabase(apiBase: string, source: string, origin: string): Promise<void> {
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

    const { database, content } = createSearchInstance(source, apiBase, fetchArtifact)

    await content.init()

    const indexStarted = performance.now()
    await content.search('') // pulls the snapshot in and builds the FTS index
    log(`index built in ${since(indexStarted)} — ${await indexedRows(database, source)} row(s)`)

    active = { apiBase, instance: content }
    log(`ready in ${since(started)}`)
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
  const results = await active.instance.search(query, {
    limit: 25,
    snippet: { columns: ['content'] },
    ...opts
  })
  log(`query "${query}" -> ${results.length} result(s) in ${since(queryStarted)}`)
  return results
}
