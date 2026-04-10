<script setup lang="ts">
definePageMeta({
  layout: 'chat'
})

useHead({
  title: 'Chat with Nuxt AI'
})

useSeoMeta({
  ogTitle: 'Chat with Nuxt AI',
  ogDescription: 'Ask anything about Nuxt — get help with docs, modules, deployment, and more.',
  twitterTitle: 'Chat with Nuxt AI',
  twitterDescription: 'Ask anything about Nuxt — get help with docs, modules, deployment, and more.'
})
</script>

<template>
  <ClientOnly>
    <ChatPanel />
  </ClientOnly>
</template>
