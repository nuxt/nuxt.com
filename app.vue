<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

const search = ref(null)
const colorMode = useColorMode()
const { headerLinks, searchGroups, searchLinks } = useNavigation()
const color = computed(() => colorMode.value === 'dark' ? '#18181b' : 'white')

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', {
  default: () => [],
  server: false
})

useHead({
  titleTemplate: title => title ? `${title} · Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
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

watch(() => search.value?.commandPaletteRef?.query, debounce((query: string) => {
  if (!query) {
    return
  }

  useTrackEvent('Search', { props: { query: `${query} - ${search.value?.commandPaletteRef.results.length} results` } })
}, 500))

// Provide
provide('navigation', navigation)
</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <AppHeader :links="headerLinks" />

    <UMain>
      <NuxtPage />
    </UMain>

    <AppFooter />

    <ClientOnly>
      <UDocsSearch ref="search" :files="files" :navigation="navigation[0]?.children" :groups="searchGroups" :links="searchLinks" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
