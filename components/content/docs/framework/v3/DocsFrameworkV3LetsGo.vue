<template>
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
