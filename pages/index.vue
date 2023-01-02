<template>
  <div>
    <ContentRenderer :value="page" class="overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetchList: fetchShowcases } = useResourcesShowcases()
const { fetchList: fetchModules } = useModules()

await fetchShowcases()
await fetchModules()

useContentHead(page)
</script>
