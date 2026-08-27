import type { SearchOptions, SearchResult } from 'comark-content'
import type { SearchWorkerPayload, SearchWorkerResponse } from '../types/search-worker'
import { instanceHeadPath, docsInstanceKey } from '#shared/utils/content'

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ContentHead {
  /** Instance root to read artifacts from: SHA-pinned and immutable, or live in dev. */
  base: string
  sha: string | null
  sources: string[]
}

const status = ref<SearchStatus>('idle')

let worker: Worker | undefined
let nextId = 0
const pending = new Map<number, { resolve: (results: SearchResult[]) => void, reject: (error: Error) => void }>()

/** Hydration logging switch: `?debug=search` */
function searchDebug(): boolean {
  if (!import.meta.client) return false
  return new URLSearchParams(location.search).get('debug') === 'search'
}

function getWorker(): Worker {
  if (worker) return worker

  worker = new Worker(new URL('../workers/search.worker.ts', import.meta.url), { type: 'module' })

  worker.onmessage = (event: MessageEvent<SearchWorkerResponse>) => {
    const message = event.data
    if (message.type === 'status') {
      status.value = message.value
      if (searchDebug()) console.info(`[search] status -> ${message.value}`)
      return
    }
    const settle = pending.get(message.id)
    if (!settle) return
    pending.delete(message.id)
    if (message.type === 'result') settle.resolve(message.results)
    else {
      if (searchDebug()) console.error(`[search] request ${message.id} failed:`, message.message)
      settle.reject(new Error(message.message))
    }
  }

  worker.onerror = () => {
    status.value = 'error'
    for (const { reject } of pending.values()) reject(new Error('[search] the search worker failed to load'))
    pending.clear()
  }

  return worker
}

function request(message: SearchWorkerPayload): Promise<SearchResult[]> {
  const id = ++nextId
  return new Promise<SearchResult[]>((resolve, reject) => {
    pending.set(id, { resolve, reject })
    try {
      getWorker().postMessage({ ...message, id })
    } catch (error) {
      pending.delete(id)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/**
 * Client-side full-text search over the active docs version (sqlite-wasm FTS5), hydrated from that
 * instance's per-commit snapshot artifacts.
 */
export function useSearch() {
  const { docsVersion } = useDocsVersion()

  const instanceKey = computed(() => docsInstanceKey(docsVersion.value))

  // `useFetch` rather than `useAsyncData`: the URL is version-dependent, and a getter *key* would be
  // rewritten into the handler slot by Nuxt's auto-key transform (which prepends a key whenever the
  // first argument is not a string literal). A getter *URL* is `useFetch`'s documented API, and it
  // rekeys and refetches on change, which is exactly the version-switch behaviour wanted here.
  // `server: false` is required, not an optimisation: the palette renders inside `<ClientOnly>`, so
  // with the default `server: true` Nuxt expects this in the SSR payload, finds nothing, and
  // resolves with the fallback *without* ever fetching.
  const { data: head, refresh: refreshHead } = useFetch<ContentHead>(
    () => instanceHeadPath(instanceKey.value),
    { server: false, default: () => ({ base: '', sha: null, sources: [] }) }
  )

  /**
   * What the worker needs to build a database. The palette renders client-only, so `head` is not in
   * the payload and resolves after mount — hence watching this rather than warming up once.
   */
  const target = computed(() => ({ base: head.value?.base ?? '', sources: head.value?.sources ?? [] }))

  /** Target key for watcher to track changes to the target. */
  const targetKey = computed(() => `${target.value.base}|${target.value.sources.join(',')}`)

  /**
   * Load the database ahead of the first keystroke. Safe to call repeatedly: the worker holds the
   * "already loading or loaded" guard, since this side's `status` lags a message behind.
   */
  async function warmup(): Promise<void> {
    const debug = searchDebug()
    // `head` has not landed yet: the `target` watcher warms up as soon as it does
    if (!target.value.sources.length) {
      if (debug) console.info('[search] warmup deferred — waiting for the instance head')
      return
    }
    try {
      if (!head.value?.sha && !import.meta.dev) {
        throw new Error(`[search] ${instanceHeadPath(instanceKey.value)} returned no commit pin`)
      }
      if (debug) console.info(`[search] warmup from ${target.value.base} (head ${head.value?.sha ?? 'unpinned'})`)

      await request({
        type: 'warmup',
        apiBase: target.value.base,
        sources: target.value.sources,
        origin: location.origin,
        debug
      })
    } catch (error) {
      // A push while the tab was open rotated the SHA, so the pinned artifacts 404. Re-pin and
      // retry once — any second failure is real.
      const staleSha = head.value?.sha
      await refreshHead()
      if (head.value?.sha && head.value.sha !== staleSha) {
        if (debug) console.info(`[search] re-pinned ${staleSha} -> ${head.value.sha}, rebuilding`)
        await request({
          type: 'warmup',
          apiBase: head.value.base,
          sources: head.value.sources,
          origin: location.origin,
          debug
        }).catch((retryError) => {
          status.value = 'error'
          console.error('[search] could not load the search database', retryError)
        })
        return
      }
      status.value = 'error'
      console.error('[search] could not load the search database', error)
    }
  }

  if (import.meta.client) {
    onNuxtReady(warmup)
    watch(targetKey, () => warmup())
  }

  async function search(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
    return request({ type: 'search', query, opts })
  }

  return { search, status: readonly(status), warmup }
}
