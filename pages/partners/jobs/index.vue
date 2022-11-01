<template>
  <div>
    <JobsHero />
    <JobsList />
  </div>
</template>

<script setup lang="ts">
const { fetch: fetchJobs } = useNuxtJobs()

await fetchJobs()

useHead({
  title: 'Jobs',
  meta: [
    { name: 'description', content: 'Browse available openings for coding with Vue and Nuxt all over the world.' }
  ]
})
</script>
