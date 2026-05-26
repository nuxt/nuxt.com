<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const { version } = useDocsVersion()

const collection = computed(() => version.value.collection)

const { status, search, init } = useSearchCollection(collection, {
  immediate: false,
  ignoredTags: ['style']
})

const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { open } = useContentSearch()
const { track } = useAnalytics()

const fuse = {
  resultLimit: 25,
  fuseOptions: {
    useTokenSearch: false
  }
}

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
    :fuse="fuse"
    :transition="false"
  />
</template>
