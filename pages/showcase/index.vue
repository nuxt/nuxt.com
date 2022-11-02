<template>
  <div>
    <ShowcasesHero />
    <ShowcasesList />
  </div>
</template>

<script setup lang="ts">
const { fetch: fetchShowcases } = useResourcesShowcases()

await fetchShowcases(505)

useHead({
  title: 'Showcase',
  meta: [
    { name: 'description', content: 'Discover our selection of websites built with Nuxt.' }
  ]
})
</script>
