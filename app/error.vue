<script setup lang="ts">
import type { NuxtError } from '#app'
import type { NavigationItem } from 'comark-content'
import type { ContentShas } from '#shared/types'
import { navigationPath, searchInstanceKeys } from '#shared/utils/content'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const route = useRoute()
const { version: docsVersion } = useDocsVersion()

const { data: navigation } = await useFetch<NavigationItem[]>(computed(() => navigationPath(docsVersion.value)))

const searchKeys = computed(() => searchInstanceKeys(docsVersion.value))
// Client-only: an SSR value gets baked into the page's ISR entry and would pin search to a stale commit.
const { data: searchShas } = useAsyncData(
  computed(() => `content-heads:${searchKeys.value.join(',')}`),
  () => $fetch<ContentShas>('/api/content/heads', {
    query: { keys: searchKeys.value.join(',') }
  }).catch((error) => {
    console.error('[search] could not resolve the content heads', error)
    return null
  }),
  { server: false, watch: [searchKeys] }
)

const navigationByVersion = computed(() => navigation.value ?? [])

provide('navigation', navigationByVersion)
provide('searchShas', searchShas)
</script>

<template>
  <UApp>
    <div :class="[(route.path.startsWith('/docs/') || route.path.startsWith('/deploy')) && 'root']">
      <Header />

      <UError :error="error" />

      <AppFooter />

      <ClientOnly>
        <Search :navigation="navigationByVersion" />
      </ClientOnly>
    </div>
  </UApp>
</template>
