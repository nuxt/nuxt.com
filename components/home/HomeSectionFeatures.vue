<script setup lang="ts">
defineProps<{
  features: {
    title: string
    description?: string
    icon?: string
    to?: string
  }[]
}>()
</script>

<template>
  <UPageGrid class="xl:grid-cols-4">
    <ULandingCard v-for="(feature, index) in features" :key="index" v-bind="feature" />
  </UPageGrid>
</template>
