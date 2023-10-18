<script setup lang="ts">
defineProps<{
  integrations: {
    to: string
    src: string
    alt: string
  }[]
}>()
</script>

<template>
  <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-8">
    <NuxtLink v-for="(integration, index) in integrations" :key="index" :to="integration.to" :target="integration.to.startsWith('/') ? '_self' : '_blank'" class="block lg:hover:scale-110 transition">
      <img :src="integration.src" :alt="integration.alt" loading="lazy" class="rounded-xl">
    </NuxtLink>
  </div>
</template>
