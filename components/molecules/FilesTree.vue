<template>
  <ul>
    <li v-for="file of tree" :key="file.path">
      <div
        class="flex items-center w-full py-2 pr-6 text-sm font-medium border-r-2 group focus:u-bg-gray-50 focus:outline-none"
        :class="{
          [`pl-[${24 + (level * 12)}px]`]: true,
          'u-bg-gray-100 u-border-gray-800 u-text-gray-900': isSelected(file),
          'border-transparent u-text-gray-500 hover:u-text-gray-900 hover:u-bg-gray-50': !isSelected(file) && !isDeleted(file),
          'border-transparent u-text-gray-500 cursor-not-allowed opacity-50': isDeleted(file),
          'cursor-pointer': !isDeleted(file)
        }"
        @click="selectFile(file)"
      >
        <div class="flex items-center justify-between flex-1 w-0 gap-1">
          <div class="flex items-center min-w-0 overflow-hidden">
            <FilesTreeIcon :file="file" :opened-dirs="openedDirs" class="mr-1.5" />
            <span class="min-w-0 truncate" :class="{ 'line-through': isDeleted(file) }">
              {{ file.name }}
            </span>
          </div>
          <div class="items-center gap-1.5 -mr-1 hidden group-hover:flex">
            <UButton
              v-if="isDir(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:plus"
              @click.stop="createFile(file)"
            />
            <UButton
              v-if="isFile(file) && !isDeleted(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:pencil"
              @click.stop="renameFile(file)"
            />
            <UButton
              v-if="isFile(file) && !isDeleted(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:trash"
              @click.stop="deleteFile(file)"
            />
          </div>
        </div>
      </div>

      <FilesTree
        v-if="isDir(file)"
        v-show="isDirOpen(file)"
        :level="level + 1"
        :tree="file.children"
        :selected-file="selectedFile"
        :opened-dirs="openedDirs"
        @selectFile="file => $emit('selectFile', file)"
        @createFile="file => $emit('createFile', file)"
        @renameFile="file => $emit('renameFile', file)"
        @deleteFile="file => $emit('deleteFile', file)"
        @openDir="path => $emit('openDir', path)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File, GitHubFile } from '~/types'

const props = defineProps({
  level: {
    type: Number,
    default: 0
  },
  tree: {
    type: Array as PropType<File[]>,
    default: () => []
  },
  selectedFile: {
    type: Object as PropType<GitHubFile>,
    default: null
  },
  openedDirs: {
    type: Object,
    default: () => {}
  }
})

const emit = defineEmits(['selectFile', 'createFile', 'renameFile', 'deleteFile', 'openDir'])

// Methods
const isFile = (file: File) => file.type === 'file'
const isDir = (file: File) => file.type === 'directory'
const isDirOpen = (file: File) => !!props.openedDirs[file.path]
const isSelected = (file: File) => props.selectedFile && file.path === props.selectedFile.path
const isDeleted = (file: File) => file.status === 'deleted'

const selectFile = (file: File) => {
  // Prevent click when clicking on selected file
  if (props.selectedFile && props.selectedFile.path === file.path) {
    return
  }

  if (isDir(file)) {
    emit('openDir', file.path)
    return
  }

  if (isDeleted(file)) {
    return
  }

  emit('selectFile', file)
}
const createFile = (file: File) => emit('createFile', file.path)
const renameFile = (file: File) => emit('renameFile', file.path)
const deleteFile = (file: File) => emit('deleteFile', file.path)
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
