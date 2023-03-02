<script setup lang="ts">
import { hasProtocol, joinURL } from 'ufo'

const { navigation, layout, page } = useContent()
const { website } = useAppConfig()
const { navKeyFromPath } = useContentHelpers()
const route = useRoute()

const titleTemplate = computed(() => {
  const appTitleTemplate = website.head?.titleTemplate || `%s · ${website.title}`
  if (page.value) {
    return page.value.head?.titleTemplate || navKeyFromPath(page.value._path, 'titleTemplate', navigation.value || []) || appTitleTemplate
  }
  return appTitleTemplate
})
const ogImage = computed(() => {
  const appOgImage = website.image && hasProtocol(website.image) ? website.image : joinURL('https://nuxt.com', website.image || 'social.jpg')
  if (page.value) {
    const image = page.value.image || navKeyFromPath(page.value._path, 'image', navigation.value || []) || appOgImage
    return hasProtocol(image) ? image : joinURL('https://nuxt.com', image)
  }
  return appOgImage
})

defineProps({
  padded: {
    type: Boolean,
    default: true
  }
})

useHead({
  meta: [
    () => ({ property: 'og:url', content: joinURL('https://nuxt.com', route.fullPath) })
  ]
})

watch(titleTemplate, () => {
  useHead({ titleTemplate: titleTemplate.value })
})

useContentHead({
  ...website,
  head: {
    ...website.head,
    titleTemplate: titleTemplate.value,
    meta: [
      ...(website.head?.meta || []).filter(meta => !['og:image'].includes(meta.property)),
      { property: 'og:image', content: ogImage.value },
      { property: 'og:description', content: page.value?.description }
    ]
  }
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
