<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

const { fetch: fetchRepos } = useCommunityRepositories()

await fetchPage()
await fetchRepos()
</script>
