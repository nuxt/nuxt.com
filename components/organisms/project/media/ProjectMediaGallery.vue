<template>
  <ul role="list" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 xl:gap-x-8">
    <li v-for="file in computedFiles" :key="file.name" class="relative" @click="selectFile(file)">
      <div :class="[isSelected(file) ? 'ring-2 ring-offset-2 u-ring-gray-900' : 'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:u-ring-gray-900', 'group block w-full aspect-w-10 aspect-h-7 rounded-lg u-bg-gray-100 overflow-hidden']">
        <img :src="`data:${file.mimeType};base64,${file.content}`" alt="" :class="[isSelected(file) ? '' : 'group-hover:opacity-75', 'object-contain object-center pointer-events-none']">
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
import type { GitHubFile, Project } from '~/types'

const project: Project = inject('project')
const root: string = inject('root')

const { file: selectedFile, computedFiles, select } = useProjectFiles(project, root)

const isDraft = (file: GitHubFile) => !!file.status
const isSelected = (file: GitHubFile) => selectedFile.value && file.path === selectedFile.value.path
const isDeleted = (file: GitHubFile) => file.status === 'deleted'

const selectFile = (file: GitHubFile) => {
  // Prevent click when clicking on selected file
  if (selectedFile.value && selectedFile.value.path === file.path) {
    return
  }

  if (isDeleted(file)) {
    return
  }

  select(file)
}
</script>
