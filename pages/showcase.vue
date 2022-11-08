<template>
  <ContentRenderer :key="page._id" :value="page" />
</template>

<script setup lang="ts">
const { fetch: fetchShowcases } = useResourcesShowcases()
const { page } = useContent()

await fetchShowcases()

useContentHead(page)
</script>
