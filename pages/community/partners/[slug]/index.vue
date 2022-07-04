<template>
  <CommunityPartnersPartnerLayout :page="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchPartners } = useCommunityPartners('technologies')

await Promise.all([fetchPage(), fetchPartners()])
</script>
