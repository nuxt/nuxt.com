import type { SearchOptions, SearchResult } from 'comark-content'

/**
 * Protocol between `useSearch` and `app/workers/search.worker.ts`.
 */
export type SearchWorkerPayload
  = | {
    type: 'warmup'
    /** Instance root the artifacts are read from, SHA-pinned outside dev. */
    apiBase: string
    /** The instance's sources, all indexed into one database so ranking spans the whole version. */
    sources: string[]
    origin: string
    /** Turns on the worker's hydration logging. Resolved on the main thread, which owns `?debug=search`. */
    debug?: boolean
  }
  | {
    type: 'search'
    query: string
    opts?: SearchOptions
  }

export type SearchWorkerRequest = SearchWorkerPayload & { id: number }

export type SearchWorkerResponse
  = | { type: 'status', value: 'loading' | 'ready' | 'error' }
    | { type: 'result', id: number, results: SearchResult[] }
    | { type: 'error', id: number, message: string }
