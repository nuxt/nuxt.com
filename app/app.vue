<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const { version } = useDocsVersion()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { fetchList: fetchModules } = useModules()
const { fetchList: fetchHosting } = useHostingProviders()
const { track } = useAnalytics()

const color = computed(() => colorMode.value === 'dark' ? '#020420' : 'white')

// Canonical URL + markdown alternate (for AI agents). The markdown URLs
// follow the `${url}.md` convention; Vercel rewrites them at the edge to
// the underlying /raw/...md handlers (see modules/md-rewrite.ts). The docs
// page sets its own per-page alternate, so we skip /docs/** here.
const canonicalUrl = computed(() => `https://nuxt.com${route.path === '/' ? '' : route.path.replace(/\/$/, '')}`)
const markdownAlternateUrl = computed(() => {
  const path = route.path.replace(/\/$/, '')
  if (path === '' || path === '/') return 'https://nuxt.com/raw/index.md'
  if (path === '/modules') return 'https://nuxt.com/modules.md'
  if (path === '/changelog') return 'https://nuxt.com/changelog.md'
  if (/^\/(?:blog|deploy)\//.test(path)) return `https://nuxt.com${path}.md`
  return null
})

watch(() => colorMode.preference, (newMode, oldMode) => {
  if (oldMode && newMode !== oldMode) {
    track('Color Mode Changed', { mode: newMode })
  }
})

const [{ data: navigation }, { data: files }] = await Promise.all([
  useFetch('/api/navigation.json'),
  useFetch('/api/search.json', { server: false })
])

onNuxtReady(() => {
  fetchModules()
  fetchHosting()
})

const headLinks = computed(() => {
  const links: Array<{ rel: string, href: string, type?: string }> = [
    { rel: 'canonical', href: canonicalUrl.value }
  ]
  if (markdownAlternateUrl.value) {
    links.push({ rel: 'alternate', type: 'text/markdown', href: markdownAlternateUrl.value })
  }
  return links
})

useHead({
  titleTemplate: title => title ? `${title} · Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: headLinks
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

  // Site-wide JSON-LD — Organization + WebSite. Per-page schemas (TechArticle,
  // BreadcrumbList, etc.) are added by individual pages on top of this.
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': 'https://nuxt.com/#organization',
              'name': 'Nuxt',
              'url': 'https://nuxt.com',
              'logo': 'https://nuxt.com/icon.png',
              'sameAs': [
                'https://github.com/nuxt',
                'https://x.com/nuxt_js',
                'https://bsky.app/profile/nuxt.com'
              ]
            },
            {
              '@type': 'WebSite',
              '@id': 'https://nuxt.com/#website',
              'url': 'https://nuxt.com',
              'name': 'Nuxt',
              'publisher': { '@id': 'https://nuxt.com/#organization' },
              'inLanguage': 'en'
            }
          ]
        }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
      }
    ]
  })
}

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])
const versionFiles = computed(() => files.value?.filter((file) => {
  return file.id.startsWith(version.value.path + '/') || file.id.startsWith('/blog/')
}) ?? [])

provide('navigation', versionNavigation)

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

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        v-model:search-term="searchTerm"
        :files="versionFiles"
        :navigation="versionNavigation"
        :groups="searchGroups"
        :links="searchLinks"
        :fuse="{
          resultLimit: 42,
          fuseOptions: {
            threshold: 0
          }
        }"
      />
    </ClientOnly>
  </UApp>
</template>

<style>
@media (min-width: 1024px) {
  .root {
    --ui-header-height: 112px;
  }
}
</style>
