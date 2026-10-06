import type { SearchOptions, SearchResult } from 'comark-content'
import type { ContentShas } from '#shared/types'
import { instanceBasePath, instanceBlobPath, instanceName, type ContentInstanceKey } from '#shared/utils/content'
import type { SearchTarget } from '~/workers/search'

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

const status = ref<SearchStatus>('idle')

/** Hydration logging switch: `?debug=search` */
function searchDebug(): boolean {
  if (!import.meta.client) return false
  return new URLSearchParams(location.search).get('debug') === 'search'
}

/**
 * Client-side full-text search over the active docs version, the CLI corresponding reference and the
 * examples (sqlite-wasm FTS5), hydrated from each instance's per-commit snapshot artifacts.
 */
export function useSearch() {
  // Fetched once in `app.vue`/`error.vue`
  const shas = inject<Ref<ContentShas | null | undefined>>('searchShas', ref(undefined))

  /**
   * What to hydrate from. The keys `shas` actually carries —
   * not a re-derivation of the search corpus — so a target set never drifts from what was fetched.
   */
  const targets = computed<SearchTarget[] | null>(() => {
    if (!shas.value) return null
    const entries = Object.entries(shas.value) as Array<[ContentInstanceKey, string | null]>
    if (!entries.length) return null

    return entries.map(([key, sha]) => ({
      name: instanceName(key),
      base: sha ? instanceBlobPath(key, sha) : instanceBasePath(key)
    }))
  })

  /** Target set key for the watcher to track changes to. */
  const targetsKey = computed(() => targets.value?.map(target => `${target.name}@${target.base}`).join('|'))

  /**
   * Load the hub for the current target set.
   * No-op once loading or ready for it — the worker itself guards that.
   */
  async function warmup(): Promise<void> {
    // Not resolved yet — the `watch` below re-runs this once `shas` lands.
    if (shas.value === undefined) return

    const current = targets.value
    if (!current) {
      console.error('[search] content shas resolved to nothing — search hidden')
      return
    }

    status.value = 'loading'
    try {
      const debug = searchDebug()
      if (debug) console.info(`[search] warmup from ${current.map(target => target.base).join(', ')}`)

      await warmupSearch(current, location.origin, debug)
      status.value = 'ready'
    } catch (error) {
      status.value = 'error'
      console.error('[search] could not load the search database', error)
    }
  }

  if (import.meta.client) {
    onNuxtReady(warmup)
    watch(targetsKey, warmup)
  }

  async function search(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
    return searchContent(query, opts)
  }

  return { search, status: readonly(status), warmup }
}
