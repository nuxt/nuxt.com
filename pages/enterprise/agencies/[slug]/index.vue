<template>
  <AgenciesPartnerLayout :page="page" />
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetchList } = useAgencyPartners()

await fetchList()

usePageNotFound(page)
</script>
