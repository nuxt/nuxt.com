<template>
  <div class="flex gap-x-4 items-center justify-center">
    <UButton :label="leftButtonText" variant="primary" />
    <UButton :label="rightButtonText" variant="secondary" class="u-border-gray-900" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  leftButtonText: {
    type: String,
    default: 'Get started'
  },
  rightButtonText: {
    type: String,
    default: 'Migration Guide'
  }
})
</script>
