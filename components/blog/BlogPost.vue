<template>
  <NuxtLink :to="page._path" class="group">
    <div class="relative flex flex-col h-[272px] justify-between p-8 border group rounded-xl u-border-gray-200 overflow-hidden">
      <div class="flex items-center justify-between">
        <UIcon :name="icon" class="w-12 h-12 transition-all u-text-gray-300 group-hover:w-8 group-hover:h-8 group-hover:u-text-gray-900" />
        <UIcon name="uil:arrow-right" class="w-6 h-6 transition-opacity opacity-0 group-hover:opacity-100" />
      </div>
      <div class="absolute inset-x-8 bottom-8 transition-transform translate-y-[48px] group-hover:translate-y-0 space-y-1">
        <div class="text-sm font-semibold u-text-gray-400">
          <time>{{ formatDateByLocale('en', page.date) }}</time>
        </div>
        <h2 class="text-2xl font-semibold u-text-gray-900 line-clamp-2">
          {{ page.title }}
        </h2>
        <p class="font-medium transition-opacity opacity-0 u-text-gray-500 line-clamp-2 group-hover:opacity-100">
          {{ page.description }}
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { formatDateByLocale } from '../../utils'
import type { ResourcesBlogArticle } from '../../types'
const props = defineProps({
  page: {
    type: Object as PropType<ResourcesBlogArticle>,
    required: true
  }
})
const icon = computed(() => {
  switch (props.page.type) {
    case 'education':
      return 'uil:graduation-cap'
    default:
      return 'uil:fire'
  }
})
</script>
