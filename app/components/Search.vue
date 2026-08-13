<script setup lang="ts">
import type { ContentSearchFile } from '@nuxt/ui'
import { DOCS_COLLECTION_SOURCES } from '#shared/utils/docs'

defineProps<{
  navigation?: Array<{ path?: string, title?: string, children?: unknown[] }>
}>()

const { version } = useDocsVersion()

const files = ref<ContentSearchFile[]>([])
const searchStatus = ref<'idle' | 'loading' | 'ready'>('idle')

async function init() {
  const collection = version.value.collection
  if (!collection) {
    files.value = []
    searchStatus.value = 'ready'
    return
  }

  searchStatus.value = 'loading'
  const items = await clientContent.list([...DOCS_COLLECTION_SOURCES[collection]])
  files.value = items
    .filter(item => item.meta.extension === '.md' && !item.meta.stem.split('/').pop()?.startsWith('.'))
    .map(item => ({
      id: item.path,
      title: item.data.title ?? item.path,
      titles: [],
      level: 0,
      content: item.data.description ?? ''
    }))
  searchStatus.value = 'ready'
}

const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { track } = useAnalytics()

const fuse = {
  resultLimit: 25,
  fuseOptions: {
    useTokenSearch: false
  }
}

onNuxtReady(init)

watch(() => version.value.collection, () => {
  searchStatus.value = 'idle'
  init()
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
    :files="files"
    :search-status="searchStatus"
    :fuse="fuse"
    :transition="false"
  />
</template>
