<script setup lang="ts">
const { page } = useContent()

usePageNotFound(page)
</script>

<template>
  <ContentRenderer v-if="page" :key="page._id" :value="page" />
  <PageError v-else />
</template>
