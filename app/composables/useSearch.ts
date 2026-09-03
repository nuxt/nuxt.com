import type { SearchOptions, SearchResult } from 'comark-content'
import { instanceHeadPath, docsInstanceKey } from '#shared/utils/content'

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ContentHead {
  /** Instance root to read artifacts from: SHA-pinned and immutable, or live in dev. */
  base: string
  sha: string | null
  sources: string[]
}

const status = ref<SearchStatus>('idle')

/**
 * The `targetKey` a hydration is loading or has landed for.
 */
let warmedKey: string | undefined

/** Hydration logging switch: `?debug=search` */
function searchDebug(): boolean {
  if (!import.meta.client) return false
  return new URLSearchParams(location.search).get('debug') === 'search'
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
   * Load the database ahead of the first keystroke. Safe to call repeatedly: skipped once already
   * loading or loaded for the current `targetKey`.
   */
  async function warmup(): Promise<void> {
    const debug = searchDebug()
    // `head` has not landed yet: the `target` watcher warms up as soon as it does
    if (!target.value.sources.length) {
      if (debug) console.info('[search] warmup deferred — waiting for the instance head')
      return
    }

    const key = targetKey.value
    if (warmedKey === key) return
    warmedKey = key
    status.value = 'loading'

    try {
      if (!head.value?.sha && !import.meta.dev) {
        throw new Error(`[search] ${instanceHeadPath(instanceKey.value)} returned no commit pin`)
      }
      if (debug) console.info(`[search] warmup from ${target.value.base} (head ${head.value?.sha ?? 'unpinned'})`)

      await warmupSearch(target.value.base, target.value.sources, location.origin, debug)
      status.value = 'ready'
    } catch (error) {
      warmedKey = undefined // clears the guard: below retries under a new key, or a later call retries this one

      // A push while the tab was open rotated the SHA, so the pinned artifacts 404. Re-pin and
      // retry once — any second failure is real.
      const staleSha = head.value?.sha
      await refreshHead()
      if (head.value?.sha && head.value.sha !== staleSha) {
        if (debug) console.info(`[search] re-pinned ${staleSha} -> ${head.value.sha}, rebuilding`)
        await warmup()
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
    return searchContent(query, opts)
  }

  return { search, status: readonly(status), warmup }
}
