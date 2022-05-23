<template>
  <div class="relative not-prose">
    <img src="/assets/docs/framework/v2/gems-big.png" class="absolute opacity-20 lg:opacity-100 top-72 -left-14 h-1/2" alt="Gem illustration">
    <img src="/assets/docs/framework/v2/gems.png" class="absolute right-0 opacity-20 lg:opacity-100 h-1/5 top-48" alt="Gem illustration">
    <div class="relative flex flex-col items-center justify-center pb-48 gap-y-8 pt-36 md:pt-44 lg:pb-56 lg:pt-36">
      <div v-if="$slots.badge" class="flex gap-x-2">
        <UBadge rounded label="Warning" />
        <span class="u-text-gray-500">
          <slot name="badge" />
        </span>
      </div>
      <h1 v-if="$slots.title" class="max-w-lg text-5xl font-semibold text-center sm:text-7xl u-text-gray-900">
        <Markdown use="title" unwrap="p" />
      </h1>
      <p v-if="$slots.description" class="text-center sm:w-1/2 text-md sm:text-lg u-text-gray-500">
        <Markdown use="description" unwrap="p" />
      </p>
      <div class="flex flex-col sm:flex-row gap-x-8">
        <UButton
          v-for="button of buttons"
          :key="button.label"
          class="flex justify-center"
          :size="button.size || 'xl'"
          :variant="button.variant || 'transparent'"
          :icon="button.icon || undefined"
          :label="button.label || ''"
          :to="button.to || '#'"
          :target="button.target"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, size?: string, icon?: string, target?: string }[]>,
    default: () => []
  }
})
</script>
