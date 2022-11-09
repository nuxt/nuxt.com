<template>
  <div>
    <ContentRenderer :value="page" class="overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetch: fetchShowcases } = useResourcesShowcases()
const { fetch: fetchModules } = useModules()

await fetchShowcases()
await fetchModules()

useContentHead(page)
</script>
