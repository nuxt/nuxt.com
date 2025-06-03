<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()
const { version } = useDocsVersion()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { fetchList } = useModules()

const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryCollectionNavigation('docsv3', ['titleTemplate']),
      queryCollectionNavigation('docsv4', ['titleTemplate']).then(data => data[0]?.children),
      queryCollectionNavigation('blog')
    ])
  }, {
    transform: data => data.flat(),
    watch: [version]
  }),
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryCollectionSearchSections('docsv3'),
      queryCollectionSearchSections('docsv4'),
      queryCollectionSearchSections('blog')
    ])
  }, {
    server: false,
    transform: data => data.flat(),
    watch: [version]
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

const versionNavigation = computed(() => navigation.value?.filter(item => item.path.startsWith(version.value.path) || item.path.startsWith('/blog/')) ?? [])

const versionFiles = computed(() => files.value?.filter(file => file.id.startsWith(`${version.value.path}/`) || file.id.startsWith('/blog/')) ?? [])

// Provide with non-null assertion since this is top level app setup
provide('navigation', versionNavigation!)

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
        :files="versionFiles"
        :navigation="versionNavigation"
        :groups="searchGroups"
        :links="searchLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
