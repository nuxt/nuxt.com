<template>
  <BlogPostLayout :page="page" />
</template>

<script setup lang="ts">
const { page } = useContent()

usePageNotFound(page)
useContentHead(page)

const route = useRoute()

useHead({
  link: [
    {
      rel: 'canonical',
      href: `https://nuxt.com${route.fullPath}`
    }
  ]
})
</script>
