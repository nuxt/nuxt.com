<template>
  <UContainer class="flex flex-col items-center py-20 last:pb-0" padded>
    <h1 v-if="$slots.title" class="pb-4 font-semibold text-center u-text-gray-900" :class="titleClass">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h1>
    <p v-if="$slots.description" class="flex justify-center pb-8 text-center u-text-gray-400 lg:w-1/2">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>
    <ContentSlot :use="$slots.content" unwrap="p" />
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  titleClass: {
    type: String,
    default: 'text-3xl'
  }
})
</script>
