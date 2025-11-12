import type { Ref, ComputedRef } from 'vue'
import type { ContentNavigationItem } from '@nuxt/content'
import type { CommandPaletteGroup } from '@nuxt/ui'
import { useWebWorkerFn, refDebounced } from '@vueuse/core'

export interface ContentSearchFile {
  id: string
  title: string
  titles: string[]
  content: string
  level: number
}

export interface ContentSearchItem {
  prefix?: string
  label?: string
  suffix?: string
  to?: string
  icon?: string
  level?: number
  matches?: any[]
  score?: number
}

export interface UseContentSearchWorkerOptions {
  /**
   * Debounce delay in milliseconds
   * @defaultValue 200
   */
  debounce?: number
  /**
   * Fuse.js threshold
   * @defaultValue 0.1
   */
  threshold?: number
  /**
   * Maximum number of results to return per group (to optimize data transfer from worker)
   * @defaultValue 100
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
    debounce = 200,
    threshold = 0.2,
    resultLimit = 12,
    timeout = 10000,
    fuseKeys = ['label', 'suffix']
  } = options

  const { mapNavigationItems, postFilter } = useContentSearch()

  // Map navigation groups (matching Nuxt UI ContentSearch pattern)
  const navigationGroups = computed(() => {
    if (!navigation.value?.length || !files.value?.length) {
      return []
    }

    if (navigation.value.some(link => !!link.children?.length)) {
      return navigation.value.map(group => ({
        id: group.path,
        label: group.title,
        items: mapNavigationItems(group.children || [], files.value)
      }))
    } else {
      return [{
        id: 'docs',
        items: mapNavigationItems(navigation.value, files.value)
      }]
    }
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

      // Search each group's items with Fuse
      return groups.map((group) => {
        // @ts-expect-error - Fuse is loaded via importScripts
        const fuse = new Fuse(group.items, {
          threshold,
          includeScore: true,
          includeMatches: true,
          ignoreLocation: true,
          keys: fuseKeys
        })

        const results = fuse.search(query, { limit: resultLimit })
        return {
          ...group,
          items: results.map((result: any) => ({
            ...result.item,
            matches: result.matches,
            score: result.score
          }))
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
    return searchedGroups.value.map(group => ({
      ...group,
      ignoreFilter: true,
      postFilter
    })) as CommandPaletteGroup<any>[]
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
