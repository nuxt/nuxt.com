<template>
  <NuxtLink
    :href="href"
    :target="target"
    class="inline-block mr-1 rounded-xs text-primary hover:text-primary/80 outline-primary/25 focus-visible:outline-3"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
// Relative links are resolved on the server (`resolveReadmeUrls`).
defineProps({
  href: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    default: undefined,
    required: false
  }
})
</script>
