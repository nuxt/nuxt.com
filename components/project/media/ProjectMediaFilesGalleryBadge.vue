<template>
  <span v-if="isDraft" class="w-2 h-2 m-1 rounded-full" :class="badgeColor" />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { GitHubFile } from '~/types'

const props = defineProps({
  file: {
    type: Object as PropType<GitHubFile>,
    required: true
  }
})

const isDraft = computed(() => !!props.file.status)

const badgeColor = computed(() => {
  switch (props.file.status) {
    case 'created':
      return 'bg-green-400'
    case 'updated':
      return 'bg-orange-400'
    case 'deleted':
      return 'bg-red-400'
    case 'renamed':
      return 'bg-blue-400'
  }
})
</script>
