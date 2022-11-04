<script setup lang="ts">
const { page } = useContent()

// Page not found, set correct status code on SSR
if (!page.value && process.server) {
  const event = useRequestEvent()
  event.res.statusCode = 404
}

useContentHead(page)
</script>

<template>
  <ContentRenderer v-if="page" :key="page._id" :value="page" />
  <PageError v-else />
</template>
