<template>
  <ContentRenderer :value="page" />
</template>

<script setup>
const { page } = useContent()

useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>
