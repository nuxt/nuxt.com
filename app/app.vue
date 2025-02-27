<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import './assets/css/twoslash.css'

const search = ref(null)
const colorMode = useColorMode()
const { searchGroups, searchLinks } = useNavigation()
const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

const { data: navigation } = await useAsyncData('navigation', () => {
  return Promise.all([
    queryCollectionNavigation('docs')
  ])
}, {
  transform: data => data.flat()
})
const { data: files } = useLazyAsyncData('search', () => {
  return Promise.all([
    queryCollectionSearchSections('docs')
  ])
}, {
  server: false,
  transform: data => data.flat()
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
  <UApp>
    <NuxtLoadingIndicator />

    <AppBanner
      id="nuxt-tips-christmas"
      title="Learn Nuxt with a Collection of 100+ Tips!"
      icon="i-ph-magic-wand"
      to="https://michaelnthiessen.com/nuxt-tips-collection?aff=J0Emk"
      :actions="[
        {
          label: 'Learn more',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-ph-arrow-right',
          to: 'https://michaelnthiessen.com/nuxt-tips-collection?aff=J0Emk'
        }
      ]"
    />

    <AppHeader />

    <HeroBackground
      class="absolute w-full transition-all text-(--ui-primary) shrink-0 -z-10"
      :class="[
        isLoading ? 'animate-pulse' : (appear ? heroBackgroundClass : 'opacity-0'),
        appeared ? 'duration-[400ms]' : 'duration-1000'
      ]"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <AppFooter />

    <ClientOnly>
      <ClientOnly>
        <LazyUContentSearch
          :files="files"
          :navigation="navigation"
          :groups="searchGroups"
          :links="searchLinks"
        />
      </ClientOnly>
    </ClientOnly>
  </UApp>
</template>
