<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
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
</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <AppBanner
      id="nuxthub-beta"
      to="https://hub.nuxt.com/blog/beta?utm_source=nuxt-website&utm_medium=banner&utm_campaign=nuxthub-beta"
    >
      <div class="flex items-center gap-2">
        <UIcon
          name="i-simple-icons-nuxtdotjs"
          class="w-5 h-5 flex-shrink-0 pointer-events-none hidden lg:inline-block"
        />
        <span>NuxtHub is now in public beta<span class="hidden sm:inline">: build & deploy full-stack Nuxt applications</span>.</span>
        <UButton
          label="Learn more"
          color="white"
          trailing-icon="i-ph-arrow-right"
          size="2xs"
          class="rounded-full"
        />
      </div>
    </AppBanner>
    <!-- <AppBanner
      id="nuxt-certification-early-bird-launch"
      to="https://certification.nuxt.com"
    >
      <div class="flex items-center gap-2">
        <UIcon
          name="i-ph-medal-duotone"
          class="w-5 h-5 flex-shrink-0 pointer-events-none"
        />
        <span>The <span class="font-semibold">Nuxt Certification Program</span> by VueSchool is out!</span>
        <UButton
          color="white"
          trailing-icon="i-ph-arrow-right"
          size="2xs"
          class="rounded-full"
        >
          Register
        </UButton>
      </div>
    </AppBanner> -->

    <AppHeader :links="headerLinks" />

    <UMain>
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
