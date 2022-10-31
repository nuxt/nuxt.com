<template>
  <div>
    <JobsHero />
    <JobsList />
  </div>
</template>

<script setup lang="ts">
const { fetch: fetchJobs } = useNuxtJobs()

await fetchJobs()
</script>
