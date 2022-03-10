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
        <div class="flex items-center justify-between flex-1">
          <div class="flex items-center truncate">
            <FilesTreeIcon :file="file" :opened-dirs="openedDirs" class="mr-1.5" />
            <div class="line-clamp-1" :class="{ 'line-through': isDeleted(file) }">
              {{ file.name }}
            </div>
            <FilesTreeIndicator :file="file" class="ml-1.5" />
          </div>
          <div class="flex gap-1.5 -mr-1">
            <UButton
              v-if="isDir(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5 invisible group-hover:visible"
              variant="transparent-hover"
              icon="heroicons-outline:plus"
              @click.stop="createFile(file)"
            />
            <UButton
              v-if="isFile(file) && !isDeleted(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5 invisible group-hover:visible"
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
        @selectFile="file => $emit('selectFile', file)"
        @createFile="file => $emit('createFile', file)"
        @deleteFile="file => $emit('deleteFile', file)"
        @openDir="openDir"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File, GitHubFile } from '~/types'

const openedDirs = reactive({})

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
  }
})

const emit = defineEmits(['selectFile', 'createFile', 'deleteFile', 'openDir'])

// Transform this to a `watch` to handle file selection from create
onMounted(() => {
  if (props.tree.find(file => file.path === props.selectedFile.path)) {
    emit('openDir', props.selectedFile.path.split('/').slice(0, -1).join('/'))
  }
})

// Methods
const isFile = (file: File) => file.type === 'file'
const isDir = (file: File) => file.type === 'directory'
const isDirOpen = (file: File) => !!openedDirs[file.path]
const isSelected = (file: File) => props.selectedFile && file.path === props.selectedFile.path
const isDeleted = (file: File) => file.status === 'deleted'

const selectFile = (file: File) => {
  // Prevent click when clicking on selected file
  if (props.selectedFile && props.selectedFile.path === file.path) {
    return
  }

  if (isDir(file)) {
    openedDirs[file.path] = !openedDirs[file.path]
    return
  }

  if (isDeleted(file)) {
    return
  }

  emit('selectFile', file)
}
const createFile = (file: File) => emit('createFile', file.path)
const deleteFile = (file: File) => emit('deleteFile', file.path)

const openDir = (path) => {
  openedDirs[path] = true

  emit('openDir', path.split('/').slice(0, -1).join('/'))
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
