<template>
  <ContentRenderer :value="page" class="overflow-hidden" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
