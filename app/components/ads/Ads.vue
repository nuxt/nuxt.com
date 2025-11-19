<script setup lang="ts">
// const { $ads } = useNuxtApp()
// const route = useRoute()
const nuxtApp = useNuxtApp()
const route = useRoute()
</script>

<template>
  <div class="space-y-3">
    <AdsMN v-if="route.path.length % 2 === 0" />
    <AdsNuxtCertificate v-else />
    <!-- <AdsFallback v-if="$ads.adBlocked.value" />
    <LazyAdsCarbon v-else :key="route.path" /> -->
  </div>
</template>
