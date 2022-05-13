<template>
  <UContainer padded class="grid grid-cols-6 gap-8 py-12 justify-items-stretch">
    <h2 class="col-span-2 text-4xl font-semibold u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>

    <div class="flex justify-end col-span-4">
      <div class="grid grid-cols-2 gap-24">
        <div v-for="(item, index) in items" :key="index" class="flex items-center justify-center lg:w-[160px]">
          <img :src="item.image" :alt="item.name">
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
