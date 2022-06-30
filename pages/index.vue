<template>
  <div>
    <ContentRenderer :value="page" class="overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
