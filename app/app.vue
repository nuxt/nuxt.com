<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const isChatRoute = computed(() => route.path === '/chat' || route.path.startsWith('/chat/'))
const { version } = useDocsVersion()
const { track } = useAnalytics()

const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

watch(() => colorMode.preference, (newMode, oldMode) => {
  if (oldMode && newMode !== oldMode) {
    track('Color Mode Changed', { mode: newMode })
  }
})

const { data: navigation } = await useFetch('/api/navigation.json')

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
  // Organization identity is provided via `schemaOrg.identity` in
  // nuxt.config.ts so the module can emit a single `#identity` node
  // (instead of a duplicated `#organization` graph entry). The WebSite
  // resolver inherits `url` from siteConfig but not `name`, so we wire
  // it up here against the same source of truth.
  useSchemaOrg([
    defineWebSite({
      name: useSiteConfig().name
    })
  ])
}

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])

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
      </div>

      <ClientOnly v-if="!isChatRoute">
        <LazyAgentFloatingInput />
        <LazyAgentPanel />
      </ClientOnly>
    </div>

    <ClientOnly>
      <Search :navigation="versionNavigation" />
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
