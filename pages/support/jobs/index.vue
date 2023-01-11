<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page } = useContent()

useHead({
  title: page.value.title,
  meta: [
    { name: 'og:title', content: page.value.title },
    { name: 'description', content: page.value.description },
    { name: 'og:description', content: page.value.description }
  ]
})
</script>
