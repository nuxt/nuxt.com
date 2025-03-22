<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const { searchGroups, searchLinks } = useNavigation()

const { data: navigation } = await useAsyncData('navigation', () => {
  return Promise.all([
    queryCollectionNavigation('docs'),
    queryCollectionNavigation('blog')
  ])
}, {
  transform: data => data.flat()
})
const { data: files } = useLazyAsyncData('search', () => {
  return Promise.all([
    queryCollectionSearchSections('docs'),
    queryCollectionSearchSections('blog')
  ])
}, {
  server: false,
  transform: data => data.flat()
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <AppHeader />

    <UError :error="error" />

    <AppFooter />

    <ClientOnly>
      <UContentSearch
        :files="files"
        shortcut="o"
        :navigation="navigation"
        :groups="searchGroups"
        :links="searchLinks"
      />
    </ClientOnly>
  </UApp>
</template>
