<template>
  <PageHero>
    <template #title>
      {{ title }}
    </template>

    <template #description>
      <span class="u-text-gray-900">
        {{ description }}
      </span>
    </template>

    <template #extra>
      <div class="flex">
        <UButton to="https://vuejobs.com/jobs/create" target="_blank" variant="primary-gradient" :label="buttonText" />
      </div>
    </template>

    <template #image>
      <div class="flex h-full items-center justify-center">
        <img src="/assets/community/jobs/hero-light.svg" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
        <img src="/assets/community/jobs/hero-dark.svg" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Post a job'
  },
  title: {
    type: String,
    default: 'Explore Nuxt Jobs'
  },
  description: {
    type: String,
    default: 'Browse available openings for coding with Vue and Nuxt all over the world.'
  }
})
</script>
