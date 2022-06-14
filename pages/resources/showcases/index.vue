<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()
const { fetch: fetchShowcases } = useResourcesShowcases()

await fetchPage()
await fetchShowcases(page.value.showcasesListId)
</script>
