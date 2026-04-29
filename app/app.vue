<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const site = useSiteConfig()
const isChatRoute = computed(() => route.path === '/chat' || route.path.startsWith('/chat/'))
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
// Suppress canonical on unversioned /docs/* paths — they're meta-refresh
// stubs that the docs-version middleware redirects to /docs/4.x/*; agents
// should not treat the stub URL as authoritative.
const canonicalUrl = computed(() => {
  if (route.path.startsWith('/docs/') && !/^\/docs\/[345]\.x(?:\/|$)/.test(route.path)) return null
  return `${site.url}${route.path === '/' ? '' : route.path.replace(/\/$/, '')}`
})
const markdownAlternateUrl = computed(() => {
  const path = route.path.replace(/\/$/, '')
  if (path === '' || path === '/') return `${site.url}/raw/index.md`
  if (path === '/modules') return `${site.url}/modules.md`
  if (path === '/changelog') return `${site.url}/changelog.md`
  if (/^\/(?:blog|deploy)\//.test(path)) return `${site.url}${path}.md`
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
  const links: Array<{ rel: string, href: string, type?: string }> = []
  if (canonicalUrl.value) {
    links.push({ rel: 'canonical', href: canonicalUrl.value })
  }
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
    htmlAttrs: { lang: 'en' },
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/icon.png' }
    ],
    // Site-wide JSON-LD — Organization + WebSite. Per-page schemas
    // (TechArticle, BreadcrumbList, etc.) are added by individual pages.
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${site.url}/#organization`,
              'name': 'Nuxt',
              'url': site.url,
              'logo': `${site.url}/icon.png`,
              'sameAs': [
                'https://github.com/nuxt',
                'https://x.com/nuxt_js',
                'https://bsky.app/profile/nuxt.com'
              ]
            },
            {
              '@type': 'WebSite',
              '@id': `${site.url}/#website`,
              'url': site.url,
              'name': 'Nuxt',
              'publisher': { '@id': `${site.url}/#organization` },
              'inLanguage': 'en'
            }
          ]
        }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
      }
    ]
  })
  useSeoMeta({
    ogSiteName: 'Nuxt',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: 'nuxt_js'
  })
}

const versionNavigation = computed(() => navigation.value?.filter(item => item.path === version.value.path || item.path === '/blog') ?? [])
const versionFiles = computed(() => files.value?.filter((file) => {
  return file.id.startsWith(version.value.path + '/') || file.id.startsWith('/blog/')
}) ?? [])

provide('navigation', versionNavigation)
</script>

<template>
  <UApp :tooltip="{ delayDuration: 500 }">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div class="flex">
      <div class="flex-1 min-w-0">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>

        <ClientOnly>
          <LazyAgentFloatingInput v-if="!isChatRoute" />
        </ClientOnly>
      </div>

      <ClientOnly>
        <LazyAgentPanel v-if="!isChatRoute" />
      </ClientOnly>
    </div>

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
