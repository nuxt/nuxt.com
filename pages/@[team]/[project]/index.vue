<template>
  <div />
</template>

<script setup lang="ts">
const route = useRoute()

await navigateTo(`${route.fullPath}/content`)
</script>
