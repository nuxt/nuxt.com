<script setup lang="ts">
const colorMode = useColorMode()

const { data: links } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), {
  default: () => [],
  transform: (navigation) => mapContentLinks(navigation.find((item) => item._path === '/docs')?.children)
})
const { data: files } = await useLazyAsyncData('files', () => queryContent('/docs').where({ _type: 'markdown', navigation: { $ne: false } }).find(), { default: () => [] })

const anchors = [{
  label: 'Documentation',
  icon: 'i-ph-book-open-text',
  to: '/docs'
}]

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

provide('links', links)
provide('anchors', anchors)
</script>

<template>
  <div>
    <AppHeader />

    <UMain>
      <NuxtPage />
    </UMain>

    <AppFooter v-if="!$route.path.startsWith('/docs')" />

    <ClientOnly>
      <UDocsSearch :files="files" :links="links" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
