<template>
  <div class="container py-8 flex flex-col gap-y-6 border-b">
    <h2 class="u-text-gray-900 text-4xl font-semibold">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>

    <p class="u-text-gray-800 text-lg">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>

    <div v-if="$slots.extra" :class="contentClass">
      <ContentSlot :use="$slots.extra" unwrap="p" />
    </div>
  </div>
</template>

<script setup lang="ts">

defineProps({
  contentClass: {
    type: String,
    default: 'flex flex-col'
  }
})
</script>
