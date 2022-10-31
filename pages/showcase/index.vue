<template>
  <div>
    <ShowcasesHero />
    <ShowcasesList />
  </div>
</template>

<script setup lang="ts">
const { fetch: fetchShowcases } = useResourcesShowcases()

await fetchShowcases(505)
</script>
