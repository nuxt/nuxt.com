<template>
  <ContentRenderer class="p-4 prose" :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage()
</script>
