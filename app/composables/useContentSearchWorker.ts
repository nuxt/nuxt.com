import type { Ref, ComputedRef } from 'vue'
import type { ContentNavigationItem } from '@nuxt/content'
import type { ContentSearchFile, ContentSearchItem } from '@nuxt/ui'
import { useWebWorkerFn, refDebounced } from '@vueuse/core'

export interface UseContentSearchWorkerOptions {
  /**
   * Debounce delay in milliseconds (lower = faster, but more worker calls)
   * @defaultValue 50
   */
  debounce?: number
  /**
   * Fuse.js threshold
   * @defaultValue 0.1
   */
  threshold?: number
  /**
   * Maximum number of results to return per group (to optimize data transfer from worker)
   * @defaultValue 42
   */
  resultLimit?: number
  /**
   * Web worker timeout in milliseconds
   * @defaultValue 10000
   */
  timeout?: number
  /**
   * Keys to search in Fuse
   * @defaultValue ['label', 'suffix']
   */
  fuseKeys?: string[]
}

export function useContentSearchWorker(
  files: Ref<ContentSearchFile[]> | ComputedRef<ContentSearchFile[]>,
  navigation: Ref<ContentNavigationItem[]> | ComputedRef<ContentNavigationItem[]>,
  searchTerm: Ref<string>,
  options: UseContentSearchWorkerOptions = {}
) {
  const {
    debounce = 50,
    threshold = 0.1,
    resultLimit = 42,
    timeout = 10000,
    fuseKeys = ['label', 'suffix']
  } = options

  const { mapNavigationItems, postFilter } = useContentSearch()

  // Map navigation groups (matching Nuxt UI ContentSearch pattern)
  const navigationGroups = computed(() => {
    if (!navigation.value?.length || !files.value?.length) {
      return []
    }

    return navigation.value?.[0]?.children?.map(group => ({
      id: group.path,
      label: group.title,
      items: mapNavigationItems(group.children || [], files.value)
    }))
  })

  // Create web worker function that handles Fuse search for each group
  const { workerFn, workerStatus, workerTerminate } = useWebWorkerFn(
    (
      groups: Array<{ id: string, label?: string, items: ContentSearchItem[] }>,
      query: string,
      threshold: number,
      resultLimit: number,
      fuseKeys: string[]
    ) => {
      // Import Fuse in worker context
      importScripts('https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js')

      // If no query, return groups as-is (postFilter will handle level filtering)
      if (!query || query.trim() === '') {
        return groups.map(group => ({
          ...group,
          items: group.items
        }))
      }

      // Flatten all items from all groups for a single Fuse search
      const allItems = groups.flatMap(group => group.items)

      // Create one Fuse instance with all items (more efficient than per-group)
      // @ts-expect-error - Fuse is loaded via importScripts
      const fuse = new Fuse(allItems, {
        threshold,
        includeScore: true,
        includeMatches: true,
        ignoreLocation: true,
        keys: fuseKeys
      })

      // Search once across all items
      const searchResults = fuse.search(query, { limit: resultLimit })
      const resultsWithMetadata = searchResults.map((result: any) => ({
        ...result.item,
        matches: result.matches,
        score: result.score
      }))

      // Group results back by their original group
      return groups.map((group) => {
        return {
          ...group,
          items: resultsWithMetadata.filter((item: any) => item.to?.startsWith(group.id))
        }
      })
    },
    {
      timeout,
      dependencies: [
        'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js'
      ]
    }
  )

  const debouncedSearchTerm = refDebounced(searchTerm, debounce)
  const searchedGroups = ref<Array<{ id: string, label?: string, items: ContentSearchItem[] }>>([])
  const isLoading = computed(() => workerStatus.value === 'RUNNING')

  // Watch for changes and trigger search automatically
  watch(
    [navigationGroups, debouncedSearchTerm],
    async ([groups, query]) => {
      if (!groups?.length) {
        searchedGroups.value = []
        return
      }

      // Skip if worker is already running (prevents the "only one instance" error)
      if (workerStatus.value === 'RUNNING') {
        return
      }

      try {
        const results = await workerFn(
          groups as any,
          query,
          threshold,
          resultLimit,
          fuseKeys
        )

        searchedGroups.value = results
      } catch (error) {
        console.error('[useContentSearchWorker] Search failed:', error)
        searchedGroups.value = []
      }
    },
    { immediate: true }
  )

  // Create final groups with ignoreFilter and postFilter for CommandPalette
  const groups = computed(() => {
    return searchedGroups.value.map((group: any) => ({
      id: group.id,
      label: group.label,
      items: group.items,
      ignoreFilter: true,
      postFilter
    })) as any
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    workerTerminate()
  })

  return {
    groups,
    isLoading,
    workerStatus
  }
}
