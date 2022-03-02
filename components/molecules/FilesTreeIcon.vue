<template>
  <UIcon
    :key="iconName"
    :name="iconName"
    class="w-4 h-4 flex-shrink-0"
  />
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import type { File } from '~/types'

const props = defineProps({
  file: {
    type: Object as PropType<File>,
    default: null
  }
})

const iconName = computed(() => {
  if (props.file.type === 'directory') {
    return `heroicons-outline:${props.file.isOpen ? 'folder-open' : 'folder'}`
  }
  return 'heroicons-outline:document-text'
})
</script>
