<template>
  <ul class="grid grid-cols-1 gap-8 pt-3 sm:grid-cols-2" :class="gridClass">
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
