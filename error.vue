<script setup lang="ts">
import type { NuxtError } from '#app'
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const { headerLinks, searchGroups, searchLinks } = useNavigation()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', { default: () => [], server: false })

provide('navigation', navigation)
</script>

<template>
  <div>
    <AppHeader :links="headerLinks" />

    <UContainer>
      <UMain>
        <UPage>
          <UPageError :error="error" />
        </UPage>
      </UMain>
    </UContainer>

    <AppFooter />

    <ClientOnly>
      <UContentSearch :files="files" :navigation="navigation[0]?.children" :groups="searchGroups" :links="searchLinks" :fuse="{ resultLimit: 13 }" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
