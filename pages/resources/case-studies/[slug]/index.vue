<template>
  <ResourcesCaseStudiesPostLayout :page="page" :prev="prev" :next="next" />
</template>

<script setup lang="ts">
const { prev, next, page, fetchPage } = useContent()

await fetchPage()
</script>
