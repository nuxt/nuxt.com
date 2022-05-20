<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()
const { fetch: fetchPartners } = useCommunityPartners()

await Promise.all([fetchPage(), fetchPartners()])
</script>
