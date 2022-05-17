<template>
  <UContainer padded class="my-36">
    <h2 class="text-4xl font-semibold lg:w-1/2 u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>
    <ul class="grid mt-14" :class="listClass">
      <Markdown use="packageList" unwrap="p" />
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  listClass: {
    type: String,
    default: 'grid-cols-2 md:grid-cols-3 gap-4'
  }
})
</script>
