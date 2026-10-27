<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

defineProps<{
  navigation?: NavigationItem[]
}>()

const { search, status } = useSearch()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { track } = useAnalytics()

const fuse = {
  resultLimit: 25
}

// `docsResults` (capped at the palette's 25) surfaces searches the docs can't answer; it is only
// sent once the index is ready, so searches made while it loads don't count as empty.
watchDebounced(searchTerm, async (term) => {
  if (!term) return
  const docsResults = status.value === 'ready' ? (await search(term, { limit: fuse.resultLimit })).length : undefined
  track('Search Performed', { term, docsResults })
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
