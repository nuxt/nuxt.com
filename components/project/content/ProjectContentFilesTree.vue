<template>
  <ul class="relative">
    <li v-for="(file, index) of tree" :ref="el => { itemRefs[file.path] = el }" :key="index">
      <div
        class="flex items-center w-full py-2 pr-6 text-sm font-medium border-r-2 group focus:u-bg-gray-50 focus:outline-none target"
        :class="{
          [`pl-[${24 + (level * 12)}px]`]: true,
          'u-bg-gray-100 u-border-gray-800 u-text-gray-900': isSelected(file),
          'border-transparent u-text-gray-500 hover:u-text-gray-900 hover:u-bg-gray-50': !isSelected(file) && !isDeleted(file),
          'border-transparent u-text-gray-500 cursor-not-allowed': isDeleted(file),
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
            <ProjectContentFilesTreeIcon :file="file" class="mr-1.5" />
            <span class="min-w-0 truncate" :class="{ 'line-through opacity-50': isDeleted(file) }">
              {{ file.name }}
            </span>
          </div>
          <div class="items-center gap-1.5 -mr-1 flex group-hover:hidden">
            <ProjectContentFilesTreeUsers :file="file" />
          </div>
          <div class="items-center gap-1.5 -mr-1 hidden group-hover:flex">
            <UButton
              v-if="isFile(file) && isDraft(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:reply"
              @click.stop="openRevertModal(file.path)"
            />
            <UButton
              v-if="isDir(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:plus"
              @click.stop="openCreateModal(file.path)"
            />
            <UButton
              v-if="isFile(file) && !isDeleted(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:pencil"
              @click.stop="openRenameModal(file.path)"
            />
            <UButton
              v-if="isFile(file) && !isDeleted(file)"
              size="xxs"
              class="-my-0.5 -mr-0.5"
              variant="transparent-hover"
              icon="heroicons-outline:trash"
              @click.stop="openDeleteModal(file.path)"
            />
          </div>
        </div>
      </div>

      <ProjectContentFilesTree
        v-if="isDir(file) && isDirOpen(file)"
        :level="level + 1"
        :tree="file.children"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { File, Project, Root, GitHubFile } from '~/types'

defineProps({
  level: {
    type: Number,
    default: 0
  },
  tree: {
    type: Array as PropType<File[]>,
    default: () => []
  }
})

const project: Project = inject('project')
const root: Root = inject('root')

const { file: selectedFile, select, openCreateModal, openRenameModal, openRevertModal, openDeleteModal } = useProjectFiles(project, root)
const { openedDirs, openDir, renameFiles } = useProjectFilesTree(project, root)

const itemRefs = ref([])

onMounted(() => {
  scrollToSelectedFile()
})

watch(() => selectedFile.value.path, () => {
  scrollToSelectedFile()
})

// Methods
const isFile = (file: File) => file.type === 'file'
const isDir = (file: File) => file.type === 'directory'
const isDirOpen = (file: File) => !!openedDirs.value[file.path]
const isDraft = (file: File) => !!file.status
const isSelected = (file: File) => selectedFile.value && file.path === selectedFile.value.path
const isDeleted = (file: File) => file.status === 'deleted'

const scrollToSelectedFile = () => {
  if (!selectedFile.value) {
    return
  }

  nextTick(() => {
    const ref = itemRefs.value[selectedFile.value.path]
    if (ref) {
      ref.scrollIntoView({ block: 'nearest' })
    }
  })
}

const selectFile = (file: File) => {
  // Prevent click when clicking on selected file
  if (selectedFile.value && selectedFile.value.path === file.path) {
    scrollToSelectedFile()
    return
  }

  if (isDir(file)) {
    openDir(file.path)
    return
  }

  if (isDeleted(file)) {
    return
  }

  select(file as unknown as GitHubFile)
}

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

const dragLeave = (e, _file) => {
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

  renameFiles(JSON.parse(src), file, position)
}

const dragEnd = (e, _file) => {
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
