<template>
  <UContainer :class="sectionClass" :constrained="!cta">
    <Markdown use="sectionContent" unwrap="p" />
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  sectionClass: {
    type: String,
    default: 'gap-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 pb-20'
  },
  cta: {
    type: Boolean,
    default: false
  }
})
</script>
