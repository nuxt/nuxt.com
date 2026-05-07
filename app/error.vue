<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const route = useRoute()
const { version } = useDocsVersion()
const { fetchList: fetchModules } = useModules()
const { fetchList: fetchHosting } = useHostingProviders()

const { data: navigation } = await useFetch('/api/navigation.json')

onNuxtReady(() => {
  fetchModules()
  fetchHosting()
})

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])

provide('navigation', versionNavigation)
</script>

<template>
  <UApp>
    <div :class="[(route.path.startsWith('/docs/') || route.path.startsWith('/deploy')) && 'root']">
      <Header />

      <UError :error="error" />

      <AppFooter />

      <ClientOnly>
        <Search :navigation="versionNavigation" />
      </ClientOnly>
    </div>
  </UApp>
</template>
