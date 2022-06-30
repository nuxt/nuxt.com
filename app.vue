<template>
  <div>
    <NuxtLoadingBar :duration="1000" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Nuxt: Intuitive Web Development',
  titleTemplate: '%s - Nuxt',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
    { name: 'description', content: 'Nuxt makes web development intuitive and fun. The open source framework NuxtJS makes the development of modern web applications simple.' },
    { name: 'og:site_name', content: 'Nuxt' },
    { name: 'og:type', content: 'website' },
    { name: 'og:image', content: 'https://nuxt.com/social.png' },
    { name: 'og:image:alt', content: 'Nuxt' },
    { name: 'twitter:image', content: 'https://nuxt.com/social-twitter.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@nuxt_js' }
  ],
  link: [
    { rel: 'icon', href: '/icon.png' }
  ],
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black [--scroll-mt:10rem] lg:[--scroll-mt:7rem]'
  }
})
</script>
