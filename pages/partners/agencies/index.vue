<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const partnerType = 'agencies'
provide('partnerType', partnerType)

const { page, fetchPage } = usePage()
const { fetch: fetchPartners } = useCommunityPartners(partnerType)

await Promise.all([fetchPage(), fetchPartners()])
</script>
