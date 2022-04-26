<template>
  <UContainer class="flex flex-col items-center py-28 not-prose" padded>
    <h1 v-if="$slots.title" class="u-text-gray-900 font-semibold pb-4" :class="sectionSm ? 'text-2xl' : 'text-3xl'">
      <Markdown use="title" unwrap="p" />
    </h1>
    <p v-if="$slots.description" class="u-text-gray-400 pb-8" :class="{ 'text-lg': !sectionSm }">
      <Markdown use="description" unwrap="p" />
    </p>
    <Markdown use="content" unwrap="p" />
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  sectionSm: {
    type: Boolean,
    default: false
  }
})
</script>
