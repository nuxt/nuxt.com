<template>
  <div
    v-if="indicator"
    class="flex items-center justify-center border border-transparent"
  >
    <span
      class="w-2 h-2 m-1 rounded-full"
      :class="indicator"
    />
  </div>
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

const indicator = computed(() => {
  if (props.file.isDeleted) { return 'bg-red-500' }
  if (props.file.isDraft) { return 'bg-gray-700' }
  if (props.file.isRenamed) { return 'bg-blue-500' }
  if (props.file.isAdded) { return 'bg-green-500' }
  if (props.file.isModified) { return 'bg-yellow-500' }
  return null
})
</script>
