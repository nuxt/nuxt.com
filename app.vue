<script setup lang="ts">
const { navigation, layout, page } = useContent()
const { website } = useAppConfig()
const { navKeyFromPath } = useContentHelpers()

const titleTemplate = computed(() => {
  const appTitleTemplate = website.head?.titleTemplate || `%s · ${website.title}`
  if (page.value) {
    return page.value.head?.titleTemplate || navKeyFromPath(page.value._path, 'titleTemplate', navigation.value || []) || appTitleTemplate
  }
  return appTitleTemplate
})
const ogImage = computed(() => {
  const appOgImage = website.image || '/social.jpg'
  if (page.value) {
    return page.value.image || navKeyFromPath(page.value._path, 'image', navigation.value || []) || appOgImage
  }
  return appOgImage
})

defineProps({
  padded: {
    type: Boolean,
    default: true
  }
})

watch(titleTemplate, () => {
  useHead({ titleTemplate: titleTemplate.value })
})
watch(ogImage, () => {
  useHead({
    meta: [
      { name: 'og:image', content: ogImage.value },
      { name: 'twitter:image', content: ogImage.value }
    ]
  })
})

useContentHead({
  ...website,
  head: {
    ...website.head,
    titleTemplate: titleTemplate.value,
    meta: [
      ...(website.head?.meta || []).filter(meta => !['og:image', 'twitter:image'].includes(meta.name)),
      { name: 'og:image', content: ogImage.value },
      { name: 'twitter:image', content: ogImage.value }
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
    <UNotifications />
  </div>
</template>
