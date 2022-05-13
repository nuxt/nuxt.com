<template>
  <UCard
    body-class="relative block w-full overflow-hidden group aspect-w-16 aspect-h-9"
    footer-class="relative flex flex-col flex-1 p-4"
    border-color-class="border-transparent"
    class="relative flex flex-col transition duration-200 transform group"
    :ring-class="`ring-1 u-ring-gray-200 ${!!to && 'lg:hover:u-ring-gray-900 lg:hover:ring-2'}`"
  >
    <img :src="template.screenshot?.url" :alt="template.screenshot?.alternativeText" class="object-cover w-full h-full pointer-events-none">

    <NuxtLink v-if="!!to" :to="to" tabindex="-1">
      <div class="absolute inset-0 transition duration-100 transform opacity-0 rounded-t-md backdrop-blur-sm bg-black/20 group-hover:opacity-100">
        <div class="flex items-center justify-center w-full h-full">
          <UIcon class="text-white w-14 h-14" name="heroicons-solid:arrow-circle-right" />
        </div>
      </div>
    </NuxtLink>

    <template #footer>
      <NuxtLink v-if="!!to" :to="to" class="focus:outline-none" tabindex="-1">
        <span class="absolute inset-0" aria-hidden="true" />
      </NuxtLink>
      <div class="flex-1 text-left">
        <p class="text-base font-semibold leading-none line-clamp-1">
          {{ template.title }}
        </p>
        <p class="mt-1 text-sm leading-5 u-text-gray-400" :class="{ 'line-clamp-1': minimal, 'line-clamp-2': !minimal }">
          {{ template.description }}
        </p>
      </div>

      <div v-if="!minimal" class="flex flex-wrap items-center mt-3 gap-x-3 gap-y-1 z-[1]">
        <a :href="template.url" target="_blank" rel="noopener" class="flex items-center gap-1 text-sm font-medium u-text-gray-600 hover:underline">
          <UIcon name="heroicons-outline:external-link" class="w-4 h-4" />
          Demo
        </a>
        <a :href="`https://github.com/${template.owner}/${template.name}/tree/${template.branch}`" target="_blank" rel="noopener" class="flex items-center gap-1 text-sm font-medium u-text-gray-600 hover:underline">
          <UIcon name="fa-brands:github" class="w-4 h-4" />
          Repository
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
  },
  minimal: {
    type: Boolean,
    default: false
  }
})
</script>
