<template>
  <component :is="component" class="relative flex flex-col gap-2justify-between border border-gray-200 dark:border-gray-800 p-4" :class="roundedClass">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 v-if="$slots.title" class="text-3xl font-semibold sm:text-5xl u-text-gray-900 mb-2 mt-2">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h2>
        <h2 v-if="$slots.extraTitle" class="font-semibold u-text-gray-900" :class="fontSizeClass">
          <ContentSlot :use="$slots.extraTitle" unwrap="p" />
        </h2>
        <p class="u-text-gray-500" :class="descriptionClass">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
      </div>

      <div v-if="buttons.length" class="flex flex-col sm:flex-row gap-4 items-start">
        <AppButton
          v-for="button of buttons"
          :key="button.label"
          :variant="button.variant || 'transparent'"
          :icon="button.icon || undefined"
          :label="button.label || ''"
          :to="button.to || undefined"
          :trailing="button.trailing"
          :size="'sm' || button.size"
        />
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

defineProps({
  fontSizeClass: {
    type: String,
    default: ''
  },
  descriptionClass: {
    type: String,
    default: ''
  },
  roundedClass: {
    type: String,
    default: 'rounded'
  },
  component: {
    type: String,
    default: 'li'
  },
  buttons: {
    type: Array as PropType<{ label?: string, variant?: any, to?: RouteLocationNormalized | RouteLocationRaw, icon?: string, trailing?: boolean, size?: string }[]>,
    default: () => []
  }
})
</script>
