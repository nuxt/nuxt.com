<template>
  <ul role="list" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 xl:gap-x-8">
    <li v-for="file in files" :key="file.name" class="relative">
      <div :class="[isSelected(file) ? 'ring-2 ring-offset-2 u-ring-gray-900' : 'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:u-ring-gray-900', 'group block w-full aspect-w-10 aspect-h-7 rounded-lg bg-gray-100 overflow-hidden']">
        <img :src="`data:${file.mimeType};base64,${file.content}`" alt="" :class="[isSelected(file) ? '' : 'group-hover:opacity-75', 'object-cover pointer-events-none']">
        <button type="button" class="absolute inset-0 focus:outline-none">
          <span class="sr-only">View details for {{ file.name }}</span>
        </button>
      </div>
      <p class="block mt-2 text-sm font-medium u-text-gray-900 truncate pointer-events-none">
        {{ file.name }}
      </p>
      <p class="block text-sm italic u-text-gray-400 pointer-events-none">
        {{ file.path }}
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { GitHubFile } from '~/types'

const props = defineProps({
  files: {
    type: Array as PropType<GitHubFile[]>,
    default: () => []
  },
  selectedFile: {
    type: Object as PropType<GitHubFile>,
    default: null
  }
})

console.log('props.files', props.files)

const isSelected = (file: File) => props.selectedFile && file.path === props.selectedFile.path
</script>
