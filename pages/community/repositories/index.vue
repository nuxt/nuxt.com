<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()
const { fetch: fetchRepositories } = useCommunityRepositories()

await Promise.all([fetchPage(), fetchRepositories()])
</script>
