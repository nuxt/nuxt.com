<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page } = useContent()
const { fetch: fetchPartners } = useAgencyPartners()

await fetchPartners()

useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>
