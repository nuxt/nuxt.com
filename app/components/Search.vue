<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const { version } = useDocsVersion()

const collections = computed(() => [version.value.collection, 'blog' as const].filter(Boolean))

const { status, search, init } = useSearchCollection(collections, {
  immediate: false,
  ignoredTags: ['style']
})

const { searchGroups, searchLinks, searchTerm, searchFuse } = useNavigation()
const { open } = useContentSearch()
const { track } = useAnalytics()

watch(open, (value) => {
  if (value && status.value === 'idle') {
    init()
  }
})

watchDebounced(searchTerm, (term) => {
  if (term) {
    track('Search Performed', { term })
  }
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
    :fuse="searchFuse"
  />
</template>
