<script setup lang="ts">
const colorMode = useColorMode()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { fetchList } = useModules()

const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryCollectionNavigation('docs', ['titleTemplate']),
      queryCollectionNavigation('blog')
    ])
  }, {
    transform: data => data.flat()
  }),
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryCollectionSearchSections('docs'),
      queryCollectionSearchSections('blog')
    ])
  }, {
    server: false,
    transform: data => data.flat()
  })
])

onNuxtReady(() => fetchList())

useHead({
  titleTemplate: title => title ? `${title} · Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { key: 'theme-color', name: 'theme-color', content: color }
  ]
})

if (import.meta.server) {
  useHead({
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
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
}

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
    <NuxtLoadingIndicator color="varprimary" />

    <UBanner
      id="nuxt-tips-michael"
      title="Learn Nuxt with a Collection of 100+ Tips!"
      icon="i-lucide-wand"
      to="https://michaelnthiessen.com/nuxt-tips-collection?aff=J0Emk"
      close
      :actions="[
        {
          label: 'View Tips',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://michaelnthiessen.com/nuxt-tips-collection?aff=J0Emk'
        }
      ]"
    />

    <AppHeader />

    <UMain class="relative">
      <HeroBackground
        class="absolute w-full -top-px transition-all text-primary shrink-0 -z-10"
        :class="[
          isLoading ? 'animate-pulse' : (appear ? heroBackgroundClass : 'opacity-0'),
          appeared ? 'duration-[400ms]' : 'duration-1000'
        ]"
      />

      <NuxtPage />
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
