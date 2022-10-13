<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchJobs } = useNuxtJobs()

await Promise.all([fetchPage(), fetchJobs()])
</script>
