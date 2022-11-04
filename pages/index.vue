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

useHead({
  title: 'Intuitive Web Development',
  meta: [
    { name: 'description', content: 'Nuxt is an open source framework making web development simple and powerful.' }
  ]
})
</script>
