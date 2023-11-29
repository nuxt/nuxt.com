<script setup lang="ts">
const { $ads } = useNuxtApp()
const uiPro = Math.round(Math.random())
</script>

<template>
  <div class="space-y-3">
    <AdsUIPro v-if="uiPro" />
    <AdsFallback v-else-if="$ads.adBlocked.value" />
    <AdsCarbon v-else :key="$route.path" />
  </div>
</template>
