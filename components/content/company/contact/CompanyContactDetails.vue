<template>
  <div class="space-y-8">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="relative flex gap-4 p-5 border rounded-lg u-bg-gray-50 u-border-gray-200"
    >
      <div class="flex items-center justify-center w-12 h-12 border rounded-lg u-bg-white u-border-gray-200">
        <Component :is="item.icon" class="w-6 h-6 u-text-gray-900" />
      </div>

      <div class="flex flex-col flex-1 gap-2">
        <span class="text-lg font-semibold u-text-gray-900">{{ item.title }}</span>
        <span class="u-text-gray-700">{{ item.description }}</span>
      </div>

      <UIcon name="heroicons-outline:chevron-right" class="self-center w-5 h-5 u-text-gray-900" />

      <NuxtLink :to="item.to" class="absolute inset-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  items: {
    type: Array as PropType<Object>,
    default: () => []
  }
})
</script>
