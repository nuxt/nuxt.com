<template>
  <div
    class="container py-8 flex flex-col gap-y-6 w-full items-center"
  >
    <h2 v-if="$slots.title" class="u-text-gray-900 text-4xl font-semibold">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>

    <p v-if="$slots.description" class="u-text-gray-500 text-lg text-left sm:text-center">
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
    default: 'flex flex-col sm:flex-row justify-between mb-6 pt-2 gap-6 w-full'
  }
})
</script>
