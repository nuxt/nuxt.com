<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchRepositories } = useCommunityRepositories()

await Promise.all([fetchPage(), fetchRepositories()])
</script>
