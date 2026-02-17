<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const route = useRoute()
const { version } = useDocsVersion()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { fetchList: fetchModules } = useModules()
const { fetchList: fetchHosting } = useHostingProviders()

const [{ data: navigation }, { data: files }] = await Promise.all([
  useFetch('/api/navigation.json'),
  useFetch('/api/search.json', { server: false })
])

onNuxtReady(() => {
  fetchModules()
  fetchHosting()
})

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])
const versionFiles = computed(() => files.value?.filter((file) => {
  return (version.value.path === '/docs/4.x' ? file.id.startsWith('/docs/4.x/') : !file.id.startsWith('/docs/4.x')) || file.id.startsWith('/blog/')
}) ?? [])

provide('navigation', versionNavigation)
</script>

<template>
  <UApp>
    <div :class="[(route.path.startsWith('/docs/') || route.path.startsWith('/deploy')) && 'root']">
      <Header />

      <UError :error="error" />

      <AppFooter />

      <ClientOnly>
        <LazyUContentSearch
          v-model:search-term="searchTerm"
          :files="versionFiles"
          :navigation="versionNavigation"
          :groups="searchGroups"
          :links="searchLinks"
          :fuse="{
            resultLimit: 42,
            fuseOptions: {
              threshold: 0
            }
          }"
        />
      </ClientOnly>
    </div>
  </UApp>
</template>
