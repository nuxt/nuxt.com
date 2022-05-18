<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
