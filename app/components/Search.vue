<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

const props = defineProps<{
  navigation?: NavigationItem[]
}>()

const { search, status } = useSearch()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { mapSearchResults } = useContentSearch()
const { track } = useAnalytics()

const fuse = {
  resultLimit: 25
}

// `docsResults` (capped at the palette's 25) surfaces searches the docs can't answer. It counts what
// the palette shows (results outside `navigation` are dropped there too), and is left out while the
// index loads or when the search fails, so those don't count as empty.
watchDebounced(searchTerm, async (term) => {
  if (!term) return
  const results = status.value === 'ready' ? await search(term, { limit: fuse.resultLimit }).catch(() => undefined) : undefined
  track('Search Performed', { term, docsResults: results && mapSearchResults(results, props.navigation).length })
}, { debounce: 500 })
</script>

<template>
  <UContentSearch
    v-model:search-term="searchTerm"
    :links="searchLinks"
    :groups="searchGroups"
    :navigation="navigation"
    :search="search"
    :search-status="status"
    :loading="status === 'loading'"
    :fuse="fuse"
    :transition="false"
  />
</template>
