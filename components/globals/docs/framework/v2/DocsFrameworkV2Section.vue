<template>
  <UContainer class="flex flex-col items-center py-20 not-prose" padded>
    <h1 v-if="$slots.title" class="u-text-gray-900 font-semibold pb-4 text-center" :class="titleClass">
      <Markdown use="title" unwrap="p" />
    </h1>
    <p v-if="$slots.description" class="u-text-gray-400 pb-8 text-center flex justify-center lg:w-1/2">
      <Markdown use="description" unwrap="p" />
    </p>
    <Markdown use="content" unwrap="p" />
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
