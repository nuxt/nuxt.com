<script setup lang="ts">
import { hasProtocol, joinURL } from 'ufo'

const { navigation, layout, page } = useContent()
const { website } = useRuntimeConfig().public
const { navKeyFromPath } = useContentHelpers()
const route = useRoute()

const titleTemplate = computed(() => {
  const appTitleTemplate = website?.titleTemplate || `%s · ${website.title}`
  if (page.value) {
    return page.value.head?.titleTemplate || navKeyFromPath(page.value._path, 'titleTemplate', navigation.value || []) || appTitleTemplate
  }
  return appTitleTemplate
})
const ogImage = computed(() => {
  const appOgImage = website.image && hasProtocol(website.image) ? website.image : joinURL(website.url, website.image)
  if (page.value) {
    const image = page.value.image || navKeyFromPath(page.value._path, 'image', navigation.value || []) || appOgImage
    return hasProtocol(image) ? image : joinURL(website.url, image)
  }
  return appOgImage
})

const ogUrl = computed(() => joinURL(website.url, route.fullPath))
const title = computed(() => page.value?.head?.title || page.value?.title || 'Not found')
const description = computed(() => page.value?.head?.description || page.value?.description || 'Page not found')

useServerHead({
  link: [
    { rel: 'icon', href: '/icon.png' }
  ],
  htmlAttrs: {
    lang: 'en'
  },
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black [--scroll-mt:10rem] lg:[--scroll-mt:7rem]'
  }
})

useHead({
  link: [
    { rel: 'canonical', href: ogUrl }
  ]
})

useSeoMeta({
  titleTemplate,
  title,
  description,
  ogImage,
  ogImageAlt: title,
  ogUrl,
  ogSiteName: 'Nuxt',
  ogType: 'website',
  twitterSite: 'nuxt_js',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: ogImage,
  twitterImageAlt: title
})
</script>

<template>
  <div>
    <NuxtLoadingBar :duration="1000" />
    <NuxtLayout :name="layout || 'default'">
      <NuxtPage />
    </NuxtLayout>
    <AppNotifications />
  </div>
</template>
