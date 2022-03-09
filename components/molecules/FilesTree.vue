<template>
  <ul>
    <li v-for="file of files" :key="file.path">
      <div
        class="flex items-center w-full py-2 pr-6 text-sm font-medium border-r-2 cursor-pointer group focus:u-bg-gray-50 focus:outline-none"
        :class="{
          [`pl-[${24 + (level * 12)}px]`]: true,
          'u-bg-gray-100 u-border-gray-800 u-text-gray-900': isSelected(file),
          'border-transparent u-text-gray-500 hover:u-text-gray-900 hover:u-bg-gray-50': !isSelected(file)
        }"
        @click="selectFile(file)"
      >
        <div class="flex items-center justify-between flex-1">
          <div class="flex items-center truncate">
            <FilesTreeIcon :file="file" :opened-files="openedFiles" class="mr-1.5" />
            <div class="line-clamp-1" :class="{ 'line-through': file.isDeleted }">
              {{ file.name }}
            </div>
          </div>
          <div class="flex gap-1.5  -mr-1">
            <FilesTreeIndicator :file="file" />
            <UButton
              v-if="isDir(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5 invisible group-hover:visible"
              variant="transparent-hover"
              icon="heroicons-outline:plus"
              @click.stop="newFile(file)"
            />
          </div>
        </div>
      </div>

      <FilesTree
        v-if="isDir(file) && isOpen(file)"
        :level="level + 1"
        :files="file.children"
        :selected-file="selectedFile"
        @selectFile="file => $emit('selectFile', file)"
        @newFile="file => $emit('newFile', file)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File } from '~/types'

const openedFiles = reactive({})

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

const emit = defineEmits(['selectFile', 'newFile'])

// Methods
const isDir = (file: File) => file.type === 'directory'
const isOpen = (file: File) => {
  return !!openedFiles[file.path]
}
const isSelected = (file: File) => props.selectedFile && file.path === props.selectedFile.path
const selectFile = (file: File) => {
  // Prevent click when clicking on selected file
  if (props.selectedFile && props.selectedFile.path === file.path) {
    return
  }

  if (isDir(file)) {
    openedFiles[file.path] = !openedFiles[file.path]
    return
  }

  emit('selectFile', file)
}
const newFile = (file: File) => emit('newFile', file.path)
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
