<template>
    <UContainer padded class="mt-20 mb-36">
      <h2 class="text-4xl font-semibold lg:w-1/2 u-text-gray-900">
        <Markdown use="title" unwrap="p" />
      </h2>
      <p class="text-lg mt-11 u-text-gray-500 lg:w-3/5">
        <Markdown use="description" unwrap="p" />
      </p>
      <ul class="grid mt-11" :class="listClass">
        <Markdown use="reasonList" unwrap="p" />
      </ul>
    </UContainer>
</template>

<script setup lang="ts">
defineProps({
  listClass: {
    type: String,
    default: 'grid-cols-2 md:grid-cols-3 md:grid-cols-5 gap-4'
  }
})
</script>
