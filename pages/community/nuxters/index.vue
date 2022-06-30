<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchNuxters } = useCommunityNuxters()

await Promise.all([fetchPage(), fetchNuxters()])
</script>
