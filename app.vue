<script setup lang="ts">
const colorMode = useColorMode()
const router = useRouter()
const { navBottomLink } = useContentHelpers()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), {
  default: () => [],
  transform: (navigation) => navigation.find((item) => item._path === '/docs')?.children
})
const { data: files } = await useLazyAsyncData('files', () => queryContent('/docs').where({ _type: 'markdown', navigation: { $ne: false } }).find(), { default: () => [] })

const headerLinks = [{
  label: 'Docs',
  icon: 'i-ph-rocket-light',
  to: '/docs',
  // TODO: Remove with Nuxt 3.7
  click: (e) => {
    e?.preventDefault()

    router.push(navBottomLink(navigation.value[0]))
  }
}, {
  label: 'Modules',
  icon: 'i-ph-plug-light',
  to: '/modules'
}, {
  label: 'Showcase',
  icon: 'i-ph-sparkle-light',
  to: '/showcase'
}, {
  label: 'Enterprise',
  icon: 'i-ph-app-window-light',
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
  }, {
    label: 'Courses',
    to: '/enterprise/courses',
    description: 'Learn Nuxt.js from the experts with video courses.'
  }]
}, {
  label: 'Blog',
  icon: 'i-ph-newspaper-light',
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
    <AppHeader :links="headerLinks" />

    <UMain>
      <NuxtPage />
    </UMain>

    <AppFooter v-if="!$route.path.startsWith('/docs')" :links="footerLinks" />

    <ClientOnly>
      <UDocsSearch :files="files" :navigation="navigation" :links="headerLinks" />

      <UNotifications />
    </ClientOnly>
  </div>
</template>
