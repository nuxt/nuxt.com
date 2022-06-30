<template>
  <DocsPage :header="false" :toc="false">
    <ContentRenderer v-if="page" :value="page" />
  </DocsPage>
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
