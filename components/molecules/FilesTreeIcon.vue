<template>
  <UIcon
    :name="iconName"
    :class="iconColor"
    class="flex-shrink-0 w-4 h-4"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File } from '~/types'

const props = defineProps({
  file: {
    type: Object as PropType<File>,
    required: true
  },
  openedDirs: {
    type: Object,
    default: () => ({})
  }
})

const isOpen = computed(() => {
  return !!props.openedDirs[props.file.path]
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
  switch (props.file.status) {
    case 'created':
      return 'text-green-500'
    case 'updated':
      return 'text-yellow-500'
    case 'deleted':
      return 'text-red-500'
    case 'renamed':
      return 'text-blue-500'
  }
})
</script>
