<script setup lang="ts">
import { joinURL } from 'ufo'

definePageMeta({
  layout: 'chat'
})

const site = useSiteConfig()

useHead({
  title: 'Nuxt Agent'
})

useSeoMeta({
  ogTitle: 'Nuxt Agent · Nuxt',
  ogDescription: 'The Nuxt Agent helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  ogImage: joinURL(site.url, '/nuxt-agent.jpg'),
  twitterTitle: 'Nuxt Agent · Nuxt',
  twitterDescription: 'The Nuxt Agent helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  twitterImage: joinURL(site.url, '/nuxt-agent.jpg')
})
</script>

<template>
  <ClientOnly>
    <ChatPanel />
  </ClientOnly>
</template>
