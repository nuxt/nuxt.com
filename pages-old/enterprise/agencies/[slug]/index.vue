<template>
  <AgenciesPartnerLayout :page="page" />
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetchList } = useEnterprisePartners()

await fetchList()

usePageNotFound(page)
</script>
