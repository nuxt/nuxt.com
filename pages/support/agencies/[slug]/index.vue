<template>
  <AgenciesPartnerLayout :page="page" />
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetch: fetchPartners } = useAgencyPartners()

await fetchPartners()

useContentHead(page)
</script>
