<template>
  <CommunityPartnersPartnerLayout :page="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchPartners } = useCommunityPartners('agencies')

await Promise.all([fetchPage(), fetchPartners()])
</script>
