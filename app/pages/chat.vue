<script setup lang="ts">
definePageMeta({
  layout: 'chat'
})

useHead({
  title: 'Nuxt Agent'
})

useSeoMeta({
  ogTitle: 'Nuxt Agent · Nuxt',
  ogDescription: 'The Nuxt Agent helps you explore the documentation — ask about Nuxt, modules, deployment, and more.',
  twitterTitle: 'Nuxt Agent · Nuxt',
  twitterDescription: 'The Nuxt Agent helps you explore the documentation — ask about Nuxt, modules, deployment, and more.'
})
</script>

<template>
  <ClientOnly>
    <ChatPanel />
  </ClientOnly>
</template>
