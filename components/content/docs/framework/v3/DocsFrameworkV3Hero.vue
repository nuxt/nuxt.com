<template>
  <div class="relative flex flex-row items-center justify-between pb-48 pt-36 md:pt-44 lg:pb-56 lg:pt-36 gap-x-4">
    <div class="flex flex-col items-center lg:items-start gap-y-8">
      <div v-if="$slots.badge" class="flex flex-col items-center sm:flex-row gap-2">
        <UBadge rounded :label="badgeLabel" variant="green" />
        <span class="u-text-gray-500">
          <slot name="badge" />
        </span>
      </div>
      <h1 v-if="$slots.title" class="max-w-xl font-bold text-center lg:text-left text-5xl sm:text-7xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p v-if="$slots.description" class="sm:w-1/2 text-lg text-center lg:text-left u-text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div class="flex gap-x-6">
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
    <img src="/assets/docs/v3/hero.png" class="absolute -right-[485px] hidden lg:block" alt="hero illustration">
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  badgeLabel: {
    type: String,
    default: 'New'
  },
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, size?: string, icon?: string }[]>,
    default: () => []
  }
})
</script>
