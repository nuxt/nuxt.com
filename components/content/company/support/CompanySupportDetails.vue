<template>
  <div class="flex flex-col">
    <h2 class="text-xl font-semibold u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>
    <ul class="mt-4 space-y-2">
      <li v-for="(topic, index) in topics" :key="index" class="flex items-center">
        <UIcon name="heroicons-solid:check-circle" class="w-5 h-5 mr-2 u-text-black" />
        <span class="u-text-gray-500">{{ topic }}</span>
      </li>
    </ul>
    <div class="relative mt-16">
      <img src="/company/support/quote.svg" class="absolute -top-4 -left-8">
      <p class="relative">
        <Markdown use="quote" unwrap="p" />
      </p>
    </div>
    <div class="flex items-center gap-6 mt-6">
      <img :src="author.image" :alt="author.name">
      <div class="flex flex-col gap-1">
        <span class="text-xl font-semibold u-text-gray-900">{{ author.name }}</span>
        <span class="font-semibold uppercase u-text-gray-500">{{ author.job }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  topics: {
    type: Array,
    default: () => []
  },
  author: {
    type: Object,
    default: () => ({})
  }
})
</script>
