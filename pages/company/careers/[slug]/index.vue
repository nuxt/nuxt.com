<template>
  <UContainer class="relative pb-12 sm:pb-28" />
</template>

<script setup lang="ts">
const { fetchPage } = useContent()

await fetchPage()
</script>
