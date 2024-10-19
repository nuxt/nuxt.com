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
    <UPageCard
      v-for="(feature, index) in features"
      :key="index"
      v-bind="feature"
      :ui="{
        base: 'overflow-hidden',
        background: 'dark:bg-gradient-to-b from-gray-700/50 to-gray-900/50',
        body: {
          base: 'flex-1',
          background: 'dark:bg-gray-900/50'
        }
      }"
    />
  </UPageGrid>
</template>
