<script setup lang="ts">
const colorMode = useColorMode()

const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation())
const { data: files } = await useLazyAsyncData('files', () => queryContent('/docs').where({ _type: 'markdown', navigation: { $ne: false } }).find(), { default: () => [] })

const anchors = [{
  label: 'Documentation',
  icon: 'i-ph-book-open-text',
  to: '/docs'
}]

// Computed

const color = computed(() => colorMode.value === 'dark' ? '#18181b' : 'white')

const links = computed(() => navigation.value.find((item: any) => item._path === '/docs')?.children || [])

// Head

useHead({
  titleTemplate: title => title && title.includes('NuxtLabs UI') ? title : `${title} - NuxtLabs UI`,
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

    <NuxtPage />

    <AppFooter v-if="!$route.path.startsWith('/docs')" />

    <ClientOnly>
      <UDocsSearch :files="files" :links="links" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
