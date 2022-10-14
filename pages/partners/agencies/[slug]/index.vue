<template>
  <AgenciesPartnerLayout :page="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchPartners } = useAgencyPartners()

await Promise.all([fetchPage(), fetchPartners()])
</script>
