<template>
  <UContainer padded class="py-24">
    <h2 class="text-4xl font-semibold text-center u-text-gray-900">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>
    <div class="grid grid-cols-3 mt-10 md:px-16 lg:px-32">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex flex-col items-center"
      >
        <div class="flex items-center w-full">
          <div class="flex-1" :class="{ 'h-[1px] u-bg-gray-200': index !== 0 }" />
          <div class="relative flex items-center justify-center w-20 h-20">
            <img src="/assets/company/about/hexagon-light.svg" class="absolute dark:invisible">
            <img src="/assets/company/about/hexagon-dark.svg" class="absolute invisible dark:visible">
            <UIcon :name="item.icon" class="relative w-10 h-10 u-text-gray-900" />
          </div>
          <div class="flex-1" :class="{ 'h-[1px] u-bg-gray-200': index !== (items.length - 1) }" />
        </div>

        <h3 class="px-2 mt-5 text-2xl font-semibold text-center u-text-gray-900">
          {{ item.title }}
        </h3>

        <p class="px-2 mt-2 text-lg text-center u-text-gray-700">
          {{ item.description }}
        </p>
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
