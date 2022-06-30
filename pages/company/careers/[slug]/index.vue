<template>
  <CompanyCareersOfferLayout :page="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage()
</script>
