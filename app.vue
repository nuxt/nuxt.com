<script setup lang="ts">
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

const colorMode = useColorMode()
const { headerLinks, searchGroups, searchLinks } = useNavigation()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', { default: () => [], server: false })

// Computed

const color = computed(() => colorMode.value === 'dark' ? '#18181b' : 'white')

// Head

useHead({
  titleTemplate: title => title ? `${title} - Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
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
  ogImage: '/social.jpg',
  ogSiteName: 'Nuxt',
  ogType: 'website',
  twitterImage: '/social.jpg',
  twitterCard: 'summary_large_image',
  twitterSite: 'nuxt_js'
})

// Provide

provide('navigation', navigation)
</script>

<template>
  <div>
    <Header :links="headerLinks" />

    <UMain>
      <NuxtPage />
    </UMain>

    <Footer />

    <ClientOnly>
      <UDocsSearch :files="files" :navigation="navigation" :groups="searchGroups" :links="searchLinks" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
