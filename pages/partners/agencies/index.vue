<template>
  <ContentRenderer :value="page" />
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const { fetch: fetchPartners } = useAgencyPartners()

await Promise.all([fetchPage(), fetchPartners()])

useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>
