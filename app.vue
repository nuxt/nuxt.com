<script setup lang="ts">
const colorMode = useColorMode()
const router = useRouter()
const { navBottomLink } = useContentHelpers()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })
const { data: files } = await useLazyAsyncData('files', () => queryContent('/docs').where({ _type: 'markdown', navigation: { $ne: false } }).find(), { default: () => [] })

const headerLinks = [{
  label: 'Docs',
  icon: 'i-ph-book-open',
  to: '/docs',
  // TODO: Remove with Nuxt 3.7
  click: (e) => {
    e?.preventDefault()

    router.push(navBottomLink(navigation.value[0]))
  }
}, {
  label: 'Modules',
  icon: 'i-ph-puzzle-piece',
  to: '/modules'
}, {
  label: 'Templates',
  icon: 'i-ph-puzzle-piece',
  to: 'https://nuxt.new',
  target: '_blank'
}, {
  label: 'Showcase',
  icon: 'i-ph-projector-screen',
  to: '/showcase'
}, {
  label: 'Enterprise',
  icon: 'i-ph-app-window',
  to: '/enterprise',
  // TODO: Remove with Nuxt 3.7
  click: (e) => {
    e?.preventDefault()

    router.push('/enterprise/support')
  },
  children: [{
    label: 'Support',
    to: '/enterprise/support',
    description: 'Get help with Nuxt.js directly from the team that creates it.'
  }, {
    label: 'Agencies',
    to: '/enterprise/agencies',
    description: 'Find an agency that specializes in Nuxt.js development.'
  }, {
    label: 'Sponsors',
    to: '/enterprise/sponsors',
    description: 'Become a sponsor and get your logo on our README on GitHub with a link to your site.'
  }, {
    label: 'Jobs',
    to: '/enterprise/jobs',
    description: 'Find a job or post a job opportunity for Nuxt.js experts.'
  }]
}, {
  label: 'Blog',
  icon: 'i-ph-newspaper',
  to: '/blog'
}]

const footerLinks = [{
  label: 'NuxtLabs',
  to: 'https://nuxtlabs.com/',
  target: '_blank'
}, {
  label: 'Nuxt Studio',
  to: 'https://nuxt.studio/',
  target: '_blank'
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
          src: module.icon && module.icon.match(/^http(s)?:\/\//) ? module.icon : `https://api.nuxtjs.org/api/ipx/s_80,f_webp/gh/nuxt/modules/main/icons/${module.icon}`
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

    <Footer v-if="!$route.path.startsWith('/docs')" :links="footerLinks" />

    <ClientOnly>
      <UDocsSearch :files="files" :navigation="navigation" :groups="groups" :links="headerLinks" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
