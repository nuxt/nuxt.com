<template>
  <BlogPostLayout :page="page" />
</template>

<script setup lang="ts">
const { page } = useContent()

usePageNotFound(page)
useContentHead(page)
</script>
