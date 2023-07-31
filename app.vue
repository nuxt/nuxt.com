<script setup lang="ts">
const colorMode = useColorMode()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), {
  default: () => [],
  transform: (navigation) => navigation.find((item) => item._path === '/docs')?.children
})
const { data: files } = await useLazyAsyncData('files', () => queryContent('/docs').where({ _type: 'markdown', navigation: { $ne: false } }).find(), { default: () => [] })

const anchors = [{
  label: 'Nuxt UI',
  icon: 'i-simple-icons-nuxtdotjs',
  to: 'https://ui.nuxtlabs.com',
  target: '_blank'
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  to: 'https://github.com/nuxt-themes/ui-kit',
  target: '_blank'
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

provide('navigation', navigation)
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
      <UDocsSearch :files="files" :navigation="navigation" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
