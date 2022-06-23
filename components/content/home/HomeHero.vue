<template>
  <div class="not-prose">
    <div class="flex flex-col items-center justify-center pb-48 gap-y-8 pt-36 md:pt-44 lg:pb-56 lg:pt-36 ">
      <div v-if="$slots.badge" class="flex gap-x-2">
        <UBadge rounded label="Warning" />
        <span class="u-text-gray-500">
          <slot name="badge" />
        </span>
      </div>
      <h1 v-if="$slots.title" class="max-w-lg font-semibold text-center text-7xl u-text-gray-900">
        <Markdown :use="$slots.title" unwrap="p" />
      </h1>
      <p v-if="$slots.description" class="w-1/2 text-lg text-center u-text-gray-500">
        <Markdown :use="$slots.description" unwrap="p" />
      </p>
      <div class="flex gap-x-8">
        <UButton
          v-for="button of buttons"
          :key="button.label"
          :size="button.size || 'xl'"
          :variant="button.variant || 'transparent'"
          :icon="button.icon || undefined"
          :label="button.label || ''"
          :to="button.to || '#'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, size?: string, icon?: string }[]>,
    default: () => []
  }
})
</script>
