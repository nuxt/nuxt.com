<template>
  <div class="relative pt-8 pb-48 ">
    <div class="absolute bottom-16 w-full h-4/5 bg-gradient-to-t from-green-400 via-teal-400 to-indigoblue-600 opacity-[0.15] dark:opacity-[0.3] blur-[80px]" />
    <div class="absolute bottom-0 w-full h-16 u-bg-white" />
    <UContainer padded class="relative flex flex-col items-center justify-center gap-y-4">
      <h3 class="text-4xl font-semibold u-text-gray-900">
        <Markdown :use="$slots.title" unwramp="p" />
      </h3>
      <p class="max-w-xl text-xl text-center u-text-gray-600">
        <Markdown :use="$slots.description" unwramp="p" />
      </p>
      <div class="flex pt-6 gap-x-6">
        <UButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button"
        />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, size?: string, icon?: string, trailing?: Boolean }[]>,
    default: () => []
  }
})
</script>
