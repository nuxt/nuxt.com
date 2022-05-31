<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()
const { fetch: fetchNuxters, selectedTime } = useCommunityNuxters()

await fetchPage()

fetchNuxters()

watch(selectedTime, (value, old) => fetchNuxters({ force: value !== old }))
</script>
