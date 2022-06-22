<template>
  <div class="flex items-center justify-center gap-x-4">
    <UButton
      v-for="button of buttons"
      :key="button.label"
      class="flex justify-center"
      :variant="button.variant || 'transparent'"
      :label="button.label || ''"
      :to="button.to || '#'"
      :target="button.target"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, target?: string }[]>,
    default: () => []
  }
})
</script>
