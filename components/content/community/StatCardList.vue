<template>
  <ul class="grid grid-cols-1 gap-1 sm:gap-8 sm:grid-cols-2 border-gray-200 dark:border-gray-800 rounded-lg" :class="gridClass">
    <ContentSlot :use="$slots.default" unwrap="p" />
  </ul>
</template>

<script setup lang="ts">
defineProps({
  gridClass: {
    type: String,
    default: 'lg:grid-cols-3'
  }
})
</script>
