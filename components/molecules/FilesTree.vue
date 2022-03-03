<template>
  <ul>
    <li v-for="file of files" :key="file.path">
      <div
        class="group border-r-2 py-2 pr-6 flex items-center text-sm font-medium focus:u-bg-gray-50 focus:outline-none w-full cursor-pointer"
        :class="{
          [`pl-${6 + (level * 3)}`]: true,
          'u-bg-gray-100 u-border-gray-800 u-text-gray-900': isSelected(file),
          'border-transparent u-text-gray-500 hover:u-text-gray-900 hover:u-bg-gray-50': !isSelected(file)
        }"
        @click="selectFile(file)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center truncate">
            <FilesTreeIcon :file="file" class="mr-1.5" />
            <div class="line-clamp-1" :class="{ 'line-through': file.isDeleted }">
              {{ file.name }}
            </div>
          </div>
          <FilesTreeIndicator :file="file" />
        </div>
      </div>

      <FilesTree
        v-if="isDir(file)"
        v-show="isOpen(file)"
        :level="level + 1"
        :files="file.children"
        :selected-file="selectedFile"
        @selectFile="file => $emit('selectFile', file)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File } from '~/types'

const props = defineProps({
  level: {
    type: Number,
    default: 0
  },
  files: {
    type: Array as PropType<File[]>,
    default: () => []
  },
  selectedFile: {
    type: Object as PropType<File>,
    default: null
  }
})

const emit = defineEmits(['selectFile'])

// Methods
const isDir = (file: File) => file.type === 'directory'
const isOpen = (file: File) => file.isOpen
const isSelected = (file: File) => props.selectedFile && file.path === props.selectedFile.path
const selectFile = (file: File) => {
  // Prevent click when clicking on already selected file
  if (props.selectedFile && file.path === props.selectedFile.path) {
    return
  }

  if (isDir(file)) {
    file.isOpen = !file.isOpen
    return
  }

  emit('selectFile', file)
}
</script>

<style scoped>
.drag-over {
  background-color: var(--tw-ring-color);
}

li.drag-below {
  border-bottom-color: var(--tw-ring-color) !important;
}
li.drag-below + li {
  border-top-color: var(--tw-ring-color) !important;
}

li.drag-above {
  border-top-color: var(--tw-ring-color) !important;
}

ul.divide-y-2 > li:first-child {
  @apply border-t-2 border-transparent;
}
ul.divide-y-2 > li:last-child {
  @apply border-b-2 border-transparent;
}
</style>
