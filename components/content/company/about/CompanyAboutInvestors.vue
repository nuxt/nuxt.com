<template>
  <UContainer padded class="grid grid-cols-6 gap-8 py-24 justify-items-stretch">
    <h2 class="col-span-2 text-4xl font-semibold u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>

    <div class="flex justify-end col-span-4">
      <div class="grid grid-cols-2 gap-24">
        <div v-for="(item, index) in items" :key="index" class="flex flex-col items-center justify-center lg:w-[160px]">
          <img :src="item.image" :alt="item.name">
          <span class="mt-4 text-xl font-semibold u-text-gray-700">{{ item.name }}</span>
          <span class="text-lg u-text-gray-700">{{ item.job }}</span>
        </div>
      </div>
    </div>
  </UContainer>
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
