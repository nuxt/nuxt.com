<template>
  <Document v-model="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()
</script>
