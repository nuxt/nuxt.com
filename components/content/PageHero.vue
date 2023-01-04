<template>
  <div class="relative py-6 overflow-hidden sm:py-12">
    <div v-if="$slots.background" class="absolute inset-y-0 right-0">
      <slot name="background" />
    </div>

    <UContainer padded class="relative">
      <div v-if="image" class="absolute -right-12 -inset-y-6 sm:inset-y-0 sm:right-6 lg:right-8">
        <div class="flex h-full items-center justify-center">
          <img :src="`${image.path}-light.${image.format}`" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation" :width="image.width" :height="image.height">
          <img :src="`${image.path}-dark.${image.format}`" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation" :width="image.width" :height="image.height">
        </div>
      </div>

      <div
        v-bind="$attrs"
        class="relative flex flex-col justify-center gap-y-4 sm:gap-y-5"
        :class="{
          'items-center': centered,
          'sm:h-72': !!image || !!$slots.background,
          'sm:py-8': !image
        }"
      >
        <h1 class="text-4xl font-semibold sm:text-5xl u-text-gray-900" :class="{ 'text-center': centered }">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h1>
        <div class="font-medium sm:text-lg u-text-gray-500" :class="[descriptionWidthClass, { 'text-center': centered }]">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </div>

        <div v-if="buttonText" class="flex">
          <UButton :to="to" target="_blank" variant="primary-gradient" :label="buttonText" />
        </div>

        <ContentSlot :use="$slots.extra" unwrap="p" />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Image } from 'types'

defineProps({
  centered: {
    type: Boolean,
    default: false
  },
  descriptionWidthClass: {
    type: String,
    default: 'sm:max-w-lg'
  },
  to: {
    type: String,
    default: ''
  },
  image: {
    type: Object as PropType<Image>,
    default: () => {}
  },
  buttonText: {
    type: String,
    default: ''
  }
})
</script>
