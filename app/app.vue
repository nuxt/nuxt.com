<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import type { ParsedContent } from '@nuxt/content'
import './styles/twoslash.css'

const search = ref(null)
const colorMode = useColorMode()
const { headerLinks, searchGroups, searchLinks } = useNavigation()
const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', {
  default: () => [],
  server: false
})

useHead({
  titleTemplate: title => title ? `${title} · Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
  ogSiteName: 'Nuxt',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: 'nuxt_js'
})

watch(() => search.value?.commandPaletteRef?.query, debounce((query: string) => {
  if (!query) {
    return
  }

  useTrackEvent('Search', { props: { query: `${query} - ${search.value?.commandPaletteRef.results.length} results` } })
}, 500))

// Provide
provide('navigation', navigation)

const route = useRoute()
const heroBackgroundClass = computed(() => route.meta?.heroBackground || '')
const { isLoading } = useLoadingIndicator()
const appear = ref(false)
const appeared = ref(false)
onMounted(() => {
  setTimeout(() => {
    appear.value = true
    setTimeout(() => {
      appeared.value = true
    }, 1000)
  }, 0)
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <AppBanner
      id="vue-ams-2025"
      to="https://eventix.shop/kb2j4ewn"
    >
      <div class="flex items-center gap-1 text-black">
        <UIcon
          name="i-ph-microphone-stage-duotone"
          class="w-5 h-5 flex-shrink-0 pointer-events-none hidden md:inline-flex"
        />
        <span>
          Don't miss <span class="font-semibold">Vue.js Amsterdam</span> <span class="lg:hidden">in March </span>2025!
          <span class="hidden lg:inline">Join 1000+ Vue developers this March and <span class="font-semibold">save 10% with code NUXT</span>.</span>
          <span class="lg:hidden">Save 10% with code NUXT.</span>
        </span>
        <UButton
          label="Get your ticket"
          color="white"
          trailing-icon="i-ph-arrow-right"
          size="2xs"
          class="rounded-full ml-1"
        />
      </div>
    </AppBanner>

    <AppHeader :links="headerLinks" />

    <UMain class="relative">
      <HeroBackground
        class="absolute w-full top-[1px] transition-all text-primary flex-shrink-0"
        :class="[
          isLoading ? 'animate-pulse' : (appear ? 'opacity-100' : 'opacity-0'),
          appeared ? 'duration-[400ms]': 'duration-1000',
          heroBackgroundClass
        ]"
      />
      <NuxtPage />
    </UMain>

    <AppFooter />

    <ClientOnly>
      <UContentSearch
        ref="search"
        :files="files"
        :navigation="navigation[0]?.children"
        :groups="searchGroups"
        :links="searchLinks"
        :fuse="{ resultLimit: 13 }"
      />

      <UNotifications />
    </ClientOnly>
  </div>
</template>

<style>
#kapa-widget-container {
  visibility: hidden;
}
</style>
