<template>
  <div class="flex flex-col">
    <h2 class="text-xl font-semibold u-text-gray-900">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>
    <ul class="mt-4 space-y-2">
      <li v-for="(topic, index) in topics" :key="index" class="flex items-center">
        <Icon name="uil:check-circle" class="w-5 h-5 mr-2 u-text-black" />
        <span class="u-text-gray-500">{{ topic }}</span>
      </li>
    </ul>
    <div class="relative mt-16">
      <img src="/assets/company/support/quote.svg" class="absolute -top-4 -left-8">
      <p class="relative">
        <ContentSlot :use="$slots.quote" unwrap="p" />
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
import type { PropType } from 'vue'
import type { CompanySupportAuthor } from '~/types'

defineProps({
  topics: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  author: {
    type: Object as PropType<CompanySupportAuthor>,
    default: () => ({})
  }
})
</script>
