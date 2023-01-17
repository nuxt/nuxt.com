<template>
  <div v-if="buttons.length" class="gap-6 flex flex-col sm:flex-row">
    <UButton
      v-for="button of buttons"
      :key="button.label"
      :variant="button.variant || 'transparent'"
      :icon="button.icon || undefined"
      :label="button.label || ''"
      :to="button.to || null"
      :trailing="button.trailing"
      :size="'sm' || button.size"
      truncate
      class="focus-visible:ring-2"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, icon?: string, trailing?: boolean, size?: string }[]>,
    default: () => []
  }
})
</script>
