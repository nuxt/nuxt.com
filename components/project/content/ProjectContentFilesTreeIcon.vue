<template>
  <UIcon
    :name="iconName"
    :class="iconColor"
    class="flex-shrink-0 w-4 h-4"
  />
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { File, Project, Root } from '~/types'

const props = defineProps({
  file: {
    type: Object as PropType<File>,
    required: true
  }
})

const project: Ref<Project> = inject('project')
const root: Ref<Root> = inject('root')

const { openedDirs } = useProjectFilesTree(project.value, root.value)

const isOpen = computed(() => {
  return !!openedDirs.value[props.file.path]
})

function hasChildDraft (files) {
  for (const file of files) {
    if (file.type === 'file' && !!file.status) {
      return file.status
    }
    if (file.type === 'directory' && file.children.length) {
      const draft = hasChildDraft(file.children)
      if (draft) {
        return draft
      }
    }
  }
  return false
}

const isDraft = computed(() => {
  return hasChildDraft(props.file.children)
})

const iconName = computed(() => {
  if (props.file.type === 'directory') {
    return `heroicons-outline:${isOpen.value ? 'folder-open' : 'folder'}`
  }

  switch (props.file.status) {
    case 'created':
      return 'heroicons-outline:document-add'
    case 'updated':
      return 'heroicons-outline:document-text'
    case 'deleted':
      return 'heroicons-outline:document-remove'
    case 'renamed':
      return 'heroicons-outline:document-text'
    default:
      return 'heroicons-outline:document-text'
  }
})

const iconColor = computed(() => {
  let status = props.file.status
  if (props.file.type === 'directory') {
    status = isDraft.value
  }

  switch (status) {
    case 'created':
      return 'text-green-400'
    case 'updated':
      return 'text-orange-400'
    case 'deleted':
      return 'text-red-400'
    case 'renamed':
      return 'text-blue-400'
  }
})
</script>
