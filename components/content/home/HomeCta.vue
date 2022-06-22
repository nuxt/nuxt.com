<template>
  <div class="relative py-8 pb-48 ">
    <img src="/assets/home/gradient-cta.svg" class="absolute w-full h-full bottom-24 -left-8">
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
