<script setup lang="ts">
  }
}
// import { debounce } from 'perfect-debounce'

// interface SearchValue {
//   commandPaletteRef?: {
//     query: string
//     results: {
//       id: string
//       label: string
//       to: string
//     }[]
//   }
// }

// const search = ref<SearchValue | null>(null)
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

// watch(() => search.value?.commandPaletteRef?.query, debounce((query) => {
//   if (typeof query !== 'string') {
//     return
//   }
//   useTrackEvent('Search', { props: { query: `${query} - ${search.value?.commandPaletteRef?.results.length || 0} results` } })
// }, 500))

// Provide with non-null assertion since this is top level app setup
provide('navigation', navigation!)

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
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <UBanner
      id="mastering-nuxt-2025"
      title="Mastering Nuxt: Full Stack Unleashed - Coming March 25th."
      icon="i-lucide-school"
      to="https://masteringnuxt.com/2025?utm_source=nuxt-website&utm_medium=banner"
      close
      :actions="[
        {
          label: 'Sign up',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://masteringnuxt.com/2025?utm_source=nuxt-website&utm_medium=banner'
        }
      ]"
    />

    <AppHeader />

    <UMain class="relative">
      <HeroBackground
        class="absolute w-full -top-px transition-all text-(--ui-primary) shrink-0 -z-10"
        :class="[
          isLoading ? 'animate-pulse' : (appear ? heroBackgroundClass : 'opacity-0'),
          appeared ? 'duration-[400ms]' : 'duration-1000'
        ]"
      />

      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

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
