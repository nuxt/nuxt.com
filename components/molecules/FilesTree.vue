<template>
  <ul>
    <li v-for="(file, index) of tree" :key="index">
      <div
        class="flex items-center w-full py-2 pr-6 text-sm font-medium border-r-2 group focus:u-bg-gray-50 focus:outline-none target"
        :class="{
          [`pl-[${24 + (level * 12)}px]`]: true,
          'u-bg-gray-100 u-border-gray-800 u-text-gray-900': isSelected(file),
          'border-transparent u-text-gray-500 hover:u-text-gray-900 hover:u-bg-gray-50': !isSelected(file) && !isDeleted(file),
          'border-transparent u-text-gray-500 cursor-not-allowed opacity-50': isDeleted(file),
          'cursor-pointer': !isDeleted(file)
        }"
        :draggable="canDragFile(file)"
        @dragstart.stop="dragStart($event, file)"
        @dragover.stop="canDragFile(file) && dragOver($event, file)"
        @dragleave.stop="dragLeave($event, file)"
        @drop.stop="canDragFile(file) && drop($event, file)"
        @dragend.stop="dragEnd($event, file)"
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
        @dropFile="(...args) => $emit('dropFile', ...args)"
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
  },
  renameFiles: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['selectFile', 'createFile', 'renameFile', 'deleteFile', 'dropFile', 'openDir'])

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

const canDragFile = (file) => {
  return !isDeleted(file) && !isDir(file)
}

const dragStart = (e, file) => {
  e.dataTransfer.setData('file', JSON.stringify(file))
}

const dragOver = (e, file) => {
  let target = e.target
  while (target !== null && !target.classList.contains('target')) {
    target = target.parentNode
  }

  target.parentNode.classList.remove('drag-below')
  target.parentNode.classList.remove('drag-above')
  target.parentNode.classList.remove('drag-over')

  const bounding = target.getBoundingClientRect()
  const nodeSection = bounding.height / 3

  let position = 'over'

  if (bounding.top + nodeSection >= e.clientY) {
    position = 'above'
  } else if (bounding.top + nodeSection * 2 <= e.clientY) {
    position = 'below'
  }

  if (position === 'over' && file.type !== 'directory') {
    return false
  }

  e.preventDefault()

  target.parentNode.classList.add(`drag-${position}`)
}

const dragLeave = (e, file) => {
  let target = e.target
  while (target !== null && !target.classList.contains('target')) {
    target = target.parentNode
  }

  e.preventDefault()

  target.parentNode.classList.remove('drag-below')
  target.parentNode.classList.remove('drag-above')
  target.parentNode.classList.remove('drag-over')
}

const drop = (e, file) => {
  let target = e.target
  while (target !== null && !target.classList.contains('target')) {
    target = target.parentNode
  }

  let position
  if (target.parentNode.classList.contains('drag-over')) {
    position = 'over'
  } else if (target.parentNode.classList.contains('drag-below')) {
    position = 'below'
  } else if (target.parentNode.classList.contains('drag-above')) {
    position = 'above'
  }

  if (position === 'over' && file.type !== 'directory') {
    return false
  }

  e.preventDefault()

  target.parentNode.classList.remove('drag-below')
  target.parentNode.classList.remove('drag-above')
  target.parentNode.classList.remove('drag-over')

  const src = e.dataTransfer.getData('file')

  emit('dropFile', JSON.parse(src), file, position)
}

const dragEnd = (e, file) => {
  e.dataTransfer.clearData()
}
</script>

<style scoped>
li.drag-below::after {
  content: ' ';
  width: 100%;
  height: 3px;
  background-color: #3b82f6;
  position: absolute;
  pointer-events: none;
}

li.drag-above::before {
  content: ' ';
  width: 100%;
  height: 3px;
  background-color: #3b82f6;
  position: absolute;
  pointer-events: none;
}
</style>
