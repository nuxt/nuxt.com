<template>
  <li class="flex flex-col items-center gap-y-4">
    <div class="relative">
      <img src="/assets/docs/framework/v2/hexagon.svg" alt="hexagon background">
      <div class="absolute top-0 flex items-center justify-center w-full h-full">
        <img :src="`/assets/docs/framework/v2/${icon}`" class="w-8 h-8" :alt="`${icon} illustration`">
      </div>
    </div>
    <h6 class="text-lg font-semibold text-center u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h6>
    <p class="text-center u-text-gray-400">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
  </li>
</template>
<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: ''
  }
})
</script>
