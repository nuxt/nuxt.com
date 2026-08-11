<script setup lang="ts">
import type { ContentNavigationItem } from '~/utils/content'
import { docsSourcesFromCollection } from '#shared/utils/docs'

defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const { version } = useDocsVersion()

const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

async function search(query: string) {
  if (!query?.trim()) return []
  status.value = 'loading'
  try {
    const sources = [...docsSourcesFromCollection(version.value.collection)]
    const results = await clientContent.search(sources, query, {
      limit: 25,
      snippet: { tag: 'mark', around: 30 }
    })
    status.value = 'ready'
    return results.map(r => ({
      id: r.id,
      title: r.title || r.id,
      titles: r.titles || [],
      content: r.snippets?.content || r.content || '',
      level: r.level
    }))
  } catch {
    status.value = 'error'
    return []
  }
}

const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { track } = useAnalytics()

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
    :fuse="{
      resultLimit: 25,
      fuseOptions: {
        useTokenSearch: false
      }
    }"
    :transition="false"
  />
</template>
