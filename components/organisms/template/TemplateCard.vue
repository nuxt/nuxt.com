<template>
  <UCard
    body-class="relative block w-full overflow-hidden group aspect-video"
    footer-class="flex flex-col flex-1 p-4"
    border-color-class="border-transparent"
    class="relative flex flex-col transition duration-200 transform group "
    :ring-class="`ring-1 u-ring-gray-200 ${!!to && 'lg:hover:u-ring-gray-400 lg:hover:ring-2'}`"
  >
    <img :src="template.screenshot?.url" :alt="template.screenshot?.alternativeText" class="object-cover w-full h-full pointer-events-none">

    <NuxtLink v-if="!!to" :to="to">
      <div class="absolute inset-0 transition duration-100 transform rounded-md opacity-0 group-hover:block hover:backdrop-blur-6 hover:opacity-100 mix-blend-difference">
        <div class="flex items-center justify-center w-full h-full">
          <UIcon class="w-16 h-16 u-text-gray-300" name="heroicons-solid:arrow-circle-right" />
        </div>
      </div>
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
