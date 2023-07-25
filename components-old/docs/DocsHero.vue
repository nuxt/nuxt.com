<template>
  <div class="flex justify-between gap-y-4">
    <div class="flex flex-col gap-6 md:w-[60%]" :class="{'mb-8': !image }">
      <h1 class="text-4xl font-semibold sm:text-5xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p v-if="$slots.description" class="font-medium sm:text-lg u-text-gray-500 lg:pr-8">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div v-if="$slots.extra">
        <ContentSlot :use="$slots.extra" unwrap="p" />
      </div>
    </div>
    <div v-if="image" class="flex gap-x-4 items-end justify-center hidden md:block place-self-center md:w-[40%]">
      <img
        :src="`${image.path}-light.${image.format}`"
        alt=""
        :width="image.width"
        :height="image.height"
        class="dark:hidden object-cover opacity-0 md:opacity-100 mx-auto"
      >
      <img
        :src="`${image.path}-dark.${image.format}`"
        alt=""
        :width="image.width"
        :height="image.height"
        class="hidden dark:block object-cover opacity-0 md:opacity-100 mx-auto"
      >
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import type { Image } from 'types'

defineProps({
  image: {
    type: Object as PropType<Image>,
    default: () => {}
  }
})
</script>
