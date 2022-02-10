<template>
  <UCard
    body-class="relative block w-full overflow-hidden group aspect-video"
    footer-class="flex flex-col flex-1 p-4"
    border-color-class="border-transparent"
    class="relative flex flex-col group"
    :ring-class="`ring-1 u-ring-gray-200 ${!!to && 'lg:hover:u-ring-gray-900 lg:hover:ring-2'}`"
  >
    <img :src="template.screenshot?.url" alt="" class="object-cover w-full h-full pointer-events-none">

    <NuxtLink v-if="!!to" :to="to">
      <span class="absolute inset-0 flex items-center justify-center invisible group-hover:visible">
        <span class="p-2 rounded-full opacity-75 u-bg-white z-5">
          <UIcon name="heroicons-outline:arrow-right" class="w-8 h-8 u-text-gray-900" />
        </span>
        <span class="absolute inset-0 u-bg-gray-900 opacity-20" />
      </span>
    </NuxtLink>

    <template #footer>
      <div class="flex-1">
        <p class="text-lg font-semibold leading-none truncate">
          {{ template.title }}
        </p>
        <p class="mt-1 u-text-gray-400 line-clamp-2">
          {{ template.description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center mt-3 gap-x-3 gap-y-1">
        <a :href="template.url" target="_blank" rel="noopener" class="flex items-center gap-1 text-sm font-medium u-text-gray-600 hover:underline">
          <UIcon name="heroicons-outline:external-link" class="w-4 h-4" />
          Live demo
        </a>
        <a :href="`https://github.com/${template.owner}/${template.name}/tree/${template.branch}`" target="_blank" rel="noopener" class="flex items-center gap-1 text-sm font-medium u-text-gray-600 hover:underline">
          <UIcon name="fa-brands:github" class="w-4 h-4" />
          GitHub repository
        </a>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Template } from '~/types'

defineProps({
  template: {
    type: Object as PropType<Template>,
    required: true
  },
  to: {
    type: [String, Object],
    default: null
  }
})
</script>
