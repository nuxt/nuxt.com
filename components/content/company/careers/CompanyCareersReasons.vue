<template>
  <UContainer padded class="pt-12 pb-16 sm:pb-32">
    <h2 class="text-4xl font-semibold lg:w-1/2 u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>
    <p class="mt-8 text-lg lg:w-3/5">
      <Markdown use="description" unwrap="p" />
    </p>
    <ul class="grid mt-12" :class="listClass">
      <Markdown use="list" unwrap="p" />
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  listClass: {
    type: String,
    default: 'grid-cols-2 md:grid-cols-3 gap-8'
  }
})
</script>
