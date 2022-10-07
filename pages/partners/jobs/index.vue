<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchJobs } = useCommunityJobs()

await Promise.all([fetchPage(), fetchJobs()])
</script>
