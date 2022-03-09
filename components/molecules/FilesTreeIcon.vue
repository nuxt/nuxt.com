<template>
  <UIcon
    :key="iconName"
    :name="iconName"
    class="flex-shrink-0 w-4 h-4"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File } from '~/types'

const props = defineProps({
  file: {
    type: Object as PropType<File>,
    default: null
  },
  openedFiles: {
    type: Object,
    default: () => ({})
  }
})

const isOpen = computed(() => {
  return !!props.openedFiles[props.file.path]
})

const iconName = computed(() => {
  if (props.file.type === 'directory') {
    return `heroicons-outline:${isOpen.value ? 'folder-open' : 'folder'}`
  }
  return 'heroicons-outline:document-text'
})
</script>
