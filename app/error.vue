<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { version } = useDocsVersion()

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryCollectionNavigation('docsv3', ['titleTemplate']),
      queryCollectionNavigation('docsv4', ['titleTemplate']),
      queryCollectionNavigation('blog')
    ])
  }, {
    transform: data => data.flat(),
    watch: [version]
  }),
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryCollectionSearchSections('docsv3'),
      queryCollectionSearchSections('docsv4'),
      queryCollectionSearchSections('blog')
    ])
  }, {
    server: false,
    transform: data => data.flat(),
    watch: [version]
  })
])

const versionNavigation = computed(() => [...navigation.value].splice(version.value.collection === 'docsv4' ? 1 : 0, 1))
const versionFiles = computed(() => files.value?.filter(file => file.id.startsWith(`${version.value.path}/`) || file.id.startsWith('/blog/')) ?? [])

const { fetchList } = useModules()
onNuxtReady(() => fetchList())

provide('navigation', versionNavigation)
</script>

<template>
  <UApp>
    <AppHeader />

    <UError :error="error" />

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        v-model:search-term="searchTerm"
        :files="versionFiles"
        :navigation="versionNavigation"
        :groups="searchGroups"
        :links="searchLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
