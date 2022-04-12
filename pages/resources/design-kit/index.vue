<template>
  <Content :document="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

console.log(page.value)

await fetchPage()
</script>
