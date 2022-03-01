<template>
  <UIcon
    v-if="isDir"
    name="heroicons-outline:chevron-right"
    class="transform transition opacity-50 w-3 h-3 flex-shrink-0"
    :class="file.isOpen ? 'rotate-90' : 'rotate-0'"
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

const isDir = props.file.type === 'directory'
</script>
