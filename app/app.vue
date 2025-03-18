<script setup lang="ts">
import { debounce } from 'perfect-debounce'

const search = ref(null)
const colorMode = useColorMode()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

const { data: navigation } = await useAsyncData('navigation', () => {
  return Promise.all([
    queryCollectionNavigation('docs', ['titleTemplate']),
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
      id="mastering-nuxt-2025"
      to="https://masteringnuxt.com/2025?utm_source=nuxt-website&utm_medium=banner"
    >
      <div class="flex items-center gap-1 text-black">
        <UIcon
          name="i-lucide-school"
          class="size-5 flex-shrink-0 pointer-events-none hidden lg:inline-block mr-1"
        />
        <span>Mastering Nuxt: Full Stack Unleashed - Coming March 25th.</span>
        <UButton
          label="Sign up"
          color="white"
          trailing-icon="i-ph-arrow-right"
          size="2xs"
          class="rounded-full ml-1"
        />
      </div>
    </AppBanner>

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
      <LazyUContentSearch
        v-model:search-term="searchTerm"
        :files="files"
        :navigation="navigation"
        :groups="searchGroups"
        :links="searchLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
