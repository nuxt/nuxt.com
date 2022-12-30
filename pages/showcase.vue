<template>
  <div>
    <ContentRenderer :key="page._id" :value="page" />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()

useContentHead(page)
</script>
