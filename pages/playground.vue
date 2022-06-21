<template>
  <div class="m-4">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: () => process.dev || '/404'
})
</script>
