<template>
  <ContentRenderer :value="page" class="overflow-hidden" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage()
</script>
