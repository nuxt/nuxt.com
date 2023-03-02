<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page } = useContent()

useHead({
  title: page.value.title,
  meta: [
    { property: 'og:title', content: page.value.title },
    { property: 'description', content: page.value.description },
    { property: 'og:description', content: page.value.description }
  ]
})
</script>
