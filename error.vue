<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{ error: NuxtError }>()

const { data: navigation } = await useLazyAsyncData('navigation', () => fetchContentNavigation(), { default: () => [] })

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

provide('navigation', navigation)
</script>

<template>
  <div>
    <Header :links="headerLinks" />

    <UContainer>
      <UMain>
        <UPage>
          <UPageError :error="error" />
        </UPage>
      </UMain>
    </UContainer>

    <Footer />

    <ClientOnly>
      <UNotifications />
    </ClientOnly>
  </div>
</template>
