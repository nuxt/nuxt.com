/**
 * Search worker: owns the browser-standalone `comark-content` instance (sqlite-wasm FTS5)
 * hydrated from the per-commit snapshot artifacts.
 */
import { comarkContent, readArtifact } from 'comark-content'
import sqliteWasm from 'comark-content/database/sqlite-wasm'
import sqliteFullTextSearch from 'comark-content/plugins/sqlite-full-text-search'
import { ofetch } from 'ofetch'
import { describeArtifact, indexedRows, isDebug, log, logger, setDebug, since } from './search-logger'
import type { CacheArtifact, ComarkContent } from 'comark-content'
import type { SqliteFullTextSearchMethods } from 'comark-content/plugins/sqlite-full-text-search'
import type { SearchWorkerRequest, SearchWorkerResponse } from '../types/search-worker'

type SearchInstance = ComarkContent & SqliteFullTextSearchMethods
type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * The instance currently searchable, and the artifact root it was built from.
 *
 * One at a time on purpose: `apiBase` carries both the docs version and its commit, so switching
 * version or a push replaces it.
 */
let active: { apiBase: string, sources: string[], instance: SearchInstance } | undefined
let loading: string | undefined
let status: SearchStatus = 'idle'

function post(message: SearchWorkerResponse): void {
  self.postMessage(message)
}

/** Every transition is mirrored to the main thread; the worker owns the hydration lifecycle. */
function setStatus(value: Exclude<SearchStatus, 'idle'>): void {
  status = value
  post({ type: 'status', value })
}

/**
 * Builds the database for `apiBase`. No-op when it is already loading or loaded.
 */
async function loadDatabase(apiBase: string, sources: string[], origin: string): Promise<void> {
  if (!sources.length) {
    throw new Error('[search] cannot build a database without sources')
  }

  if (loading === apiBase || active?.apiBase === apiBase) {
    log(`warmup ignored — already ${status} for ${apiBase}`)
    return
  }

  loading = apiBase
  setStatus('loading')
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

    // Held rather than inlined into the plugin so the row count below can query the index directly.
    const database = sqliteWasm()
    const content = comarkContent({
      cache: {
        loadManifest: () => fetchArtifact(`${apiBase}/manifest.json`),
        loadSnapshot: (source: string) => fetchArtifact(`${apiBase}/snapshot/${source}.json`)
      },
      plugins: [sqliteFullTextSearch({ database })],
      logger
    }) as SearchInstance

    await content.init()

    const indexStarted = performance.now()
    await content.search(sources, '') // pulls the snapshots in and builds the FTS index
    log(`index built in ${since(indexStarted)} — ${await indexedRows(database, sources)} row(s)`)

    active = { apiBase, sources, instance: content }
    setStatus('ready')
    log(`ready in ${since(started)}`)
  } catch (error) {
    setStatus('error')
    log(`hydration failed after ${since(started)}`, error)
    throw error
  } finally {
    loading = undefined
  }
}

self.onmessage = async (event: MessageEvent<SearchWorkerRequest>) => {
  const request = event.data
  try {
    if (request.type === 'warmup') {
      setDebug(request.debug === true)
      await loadDatabase(request.apiBase, request.sources, request.origin)
      post({ type: 'result', id: request.id, results: [] })
      return
    }

    const queryStarted = performance.now()
    const results = active
      ? await active.instance.search(active.sources, request.query, {
          limit: 25,
          snippet: { columns: ['content'] },
          ...request.opts
        })
      : []
    if (!active) log(`dropped query "${request.query}" — no instance yet (status ${status})`)
    else log(`query "${request.query}" -> ${results.length} result(s) in ${since(queryStarted)}`)
    post({ type: 'result', id: request.id, results })
  } catch (error) {
    post({ type: 'error', id: request.id, message: error instanceof Error ? error.message : String(error) })
  }
}
