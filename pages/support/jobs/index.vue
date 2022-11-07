<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetch: fetchJobs } = useNuxtJobs()

await fetchJobs()

useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>
