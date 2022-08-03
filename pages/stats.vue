<template>
  <div>
    <ContentRenderer :value="page" />
  </div>
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()

await fetchPage()
</script>
