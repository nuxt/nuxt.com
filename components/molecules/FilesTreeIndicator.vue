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
  switch (props.file.status) {
    case 'created':
      return 'bg-green-500'
    case 'updated':
      return 'bg-yellow-500'
    case 'deleted':
      return 'bg-red-500'
    case 'renamed':
      return 'bg-blue-500'
  }
})
</script>
