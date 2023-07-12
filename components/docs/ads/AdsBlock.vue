<template>
  <article class="mt-4">
    <AdsFallback v-if="$ads.adBlocked.value" />
    <AdsCarbon v-else :key="$route.params.slug" />
  </article>
</template>

<script setup lang="ts">
const { $ads } = useNuxtApp()
</script>
