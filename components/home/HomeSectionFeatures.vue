<script setup lang="ts">
defineProps<{
  features: {
    to: string
  }[]
}>()
</script>

<template>
  <UPageGrid class="xl:grid-cols-4">
    <UPageCard v-for="(feature, index) in features" :key="index" v-bind="feature" />
  </UPageGrid>
</template>
