<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const isChatRoute = computed(() => route.path === '/chat' || route.path.startsWith('/chat/'))
const { version } = useDocsVersion()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { fetchList: fetchModules } = useModules()
const { fetchList: fetchHosting } = useHostingProviders()
const { track } = useAnalytics()

const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

watch(() => colorMode.preference, (newMode, oldMode) => {
  if (oldMode && newMode !== oldMode) {
    track('Color Mode Changed', { mode: newMode })
  }
})

const [{ data: navigation }, { data: files }] = await Promise.all([
  useFetch('/api/navigation.json'),
  useFetch('/api/search.json', { server: false })
])

onNuxtReady(() => {
  fetchModules()
  fetchHosting()
})

useHead({
  titleTemplate: title => title ? `${title} · Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { key: 'theme-color', name: 'theme-color', content: color }
  ]
})

if (import.meta.server) {
  useHead({
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/icon.png' }
    ],
    htmlAttrs: {
      lang: 'en'
    }
  })
  useSeoMeta({
    ogSiteName: 'Nuxt',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: 'nuxt_js'
  })
}

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])
const versionFiles = computed(() => files.value?.filter((file) => {
  return file.id.startsWith(version.value.path + '/') || file.id.startsWith('/blog/')
}) ?? [])

provide('navigation', versionNavigation)
</script>

<template>
  <UApp :tooltip="{ delayDuration: 500 }">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div class="flex">
      <div class="flex-1 min-w-0">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>

        <ClientOnly>
          <LazyAgentFloatingInput v-if="!isChatRoute" />
        </ClientOnly>
      </div>

      <ClientOnly>
        <LazyAgentPanel v-if="!isChatRoute" />
      </ClientOnly>
    </div>

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
  </UApp>
</template>

<style>
@media (min-width: 1024px) {
  .root {
    --ui-header-height: 112px;
  }
}
</style>
