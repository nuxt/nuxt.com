<template>
  <div>
    <ContentRenderer :value="page" class="overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetchList: fetchShowcases } = useResourcesShowcases()
const { fetchList: fetchModules } = useModules()

/* resources are needed in the page, start fetching as soon as possible */
await Promise.all([fetchShowcases(), fetchModules()])

useContentHead(page)
</script>
