<script setup lang="ts">
const colorMode = useColorMode()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })
const { data: files } = useLazyFetch('/api/search.json', { default: () => [], server: false })

const headerLinks = [{
  label: 'Docs',
  icon: 'i-ph-book-open-duotone',
  to: '/docs'
}, {
  label: 'Modules',
  icon: 'i-ph-puzzle-piece-duotone',
  to: '/modules'
}, {
  label: 'Templates',
  icon: 'i-ph-app-window-duotone',
  to: 'https://nuxt.new',
  target: '_blank'
}, {
  label: 'Showcase',
  icon: 'i-ph-projector-screen-duotone',
  to: '/showcase'
}, {
  label: 'Enterprise',
  icon: 'i-ph-buildings-duotone',
  children: [{
    label: 'Support',
    to: '/enterprise/support',
    description: 'Get help with Nuxt.js directly from the team that creates it.',
    icon: 'i-ph-lifebuoy-duotone'
  }, {
    label: 'Agencies',
    to: '/enterprise/agencies',
    description: 'Find an agency that specializes in Nuxt.js development.',
    icon: 'i-ph-handshake-duotone'
  }, {
    label: 'Sponsors',
    to: '/enterprise/sponsors',
    description: 'Become a sponsor and get your logo on our README on GitHub with a link to your site.',
    icon: 'i-ph-hand-heart-duotone'
  }, {
    label: 'Jobs',
    to: '/enterprise/jobs',
    description: 'Find a job or post a job opportunity for Nuxt.js experts.',
    icon: 'i-ph-briefcase-duotone'
  }]
}, {
  label: 'Blog',
  icon: 'i-ph-newspaper-duotone',
  to: '/blog'
}]

const extraLinks = [{
  label: 'Design Kit',
  icon: 'i-ph-palette-duotone',
  to: '/design-kit'
}, {
  label: 'Newsletter',
  icon: 'i-ph-envelope-simple-duotone',
  to: '/newsletter'
}]

const groups = [{
  key: 'modules-search',
  label: 'Modules',
  search: async (q) => {
    const { modules, fetchList } = useModules()
    if (!modules.value.length) {
      await fetchList()
    }

    return modules.value
      .filter(module => ['name', 'npm', 'repo'].map(field => module[field]).filter(Boolean).some(value => value.search(searchTextRegExp(q)) !== -1))
      .map(module => ({
        id: `module-${module.name}`,
        label: module.name,
        suffix: module.description,
        avatar: {
          src: moduleImage(module.icon)
        },
        to: `/modules/${module.name}`
      }))
  }
}, {
  key: 'articles-search',
  label: 'Articles',
  search: async (q) => {
    if (!q) {
      return []
    }

    const { articles, fetchList } = useBlog()
    if (!articles.value.length) {
      await fetchList()
    }

    return articles.value
      .filter(article => article.title.search(searchTextRegExp(q)) !== -1)
      .map(article => ({
        id: `article-${article._path}`,
        label: article.title,
        suffix: article.description,
        icon: 'i-ph-newspaper',
        to: article._path
      }))
  }
}]

// Computed

const color = computed(() => colorMode.value === 'dark' ? '#18181b' : 'white')

// Head

useHead({
  titleTemplate: title => title ? `${title} - Nuxt` : 'Nuxt: The Intuitive Web Framework',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
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
  ogImage: '/social.jpg',
  ogSiteName: 'Nuxt',
  ogType: 'website',
  twitterImage: '/social.jpg',
  twitterCard: 'summary_large_image',
  twitterSite: 'nuxt_js'
})

// Provide

provide('navigation', navigation)
</script>

<template>
  <div>
    <Header :links="headerLinks" />

    <UMain>
      <NuxtPage />
    </UMain>

    <Footer />

    <ClientOnly>
      <UDocsSearch :files="files" :navigation="navigation" :groups="groups" :links="[...headerLinks, ...extraLinks]" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
