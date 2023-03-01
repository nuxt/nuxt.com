<template>
  <div
    class="container py-6 flex flex-col gap-y-2 w-full"
    :class="{ 'border u-border-gray-200 rounded-lg u-bg-gray-50': border }"
  >
    <div v-if="backgroundImage" :class="backgroundImageClass">
      <img
        :src="`${backgroundImage.path}-dark.${backgroundImage.format}`"
        alt=""
        class="h-full hidden dark:block"
        :width="backgroundImage.width"
        :height="backgroundImage.height"
        loading="lazy"
      >
      <img
        :src="`${backgroundImage.path}-light.${backgroundImage.format}`"
        alt=""
        class="h-full dark:hidden"
        :width="backgroundImage.width"
        :height="backgroundImage.height"
        loading="lazy"
      >
    </div>
    <h2 class="u-text-gray-900 text-2xl font-semibold">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>
    <div v-if="$slots.list">
      <ContentSlot :use="$slots.list" unwrap="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Image } from 'types'

defineProps({
  border: {
    type: Boolean,
    default: true
  },
  backgroundImageClass: {
    type: String,
    default: 'absolute right-0 bottom-0'
  },
  backgroundImage: {
    type: Object as PropType<Image>,
    default: () => {}
  }
})
</script>
