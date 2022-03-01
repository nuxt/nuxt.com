<template>
  <ul>
    <li v-for="file of files" :key="file.path">
      <div
        class="group border-r-2 py-2 px-6 flex items-center text-sm font-medium focus:bg-gray-100 focus:outline-none w-full cursor-pointer"
        :class="{
          'bg-gray-100 border-gray-800 text-gray-900': isSelected(file),
          'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50': !isSelected(file)
        }"
        @click="selectFile(file)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center truncate">
            <FilesTreeIcon :file="file" class="mr-1.5" />
            <div class="truncate whitespace-nowrap overflow-ellipsis" :class="{ 'line-through': file.isDeleted }">
              {{ file.name }}
            </div>
          </div>
          <FilesTreeIndicator :file="file" />
        </div>
      </div>

      <FilesTree
        v-if="isDir(file)"
        class="pl-3"
        :files="file.children"
        :selected-file="selectedFile"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File } from '~/types'

const props = defineProps({
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
const isSelected = (file: File) => props.selectedFile && file.path === props.selectedFile.path
const selectFile = (file: File) => {
  // Prevent click when clicking on already selected file
  if (props.selectedFile && file.path === props.selectedFile.path) {
    return
  }

  if (isDir(file)) {
    file.isOpen = !file.isOpen
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
