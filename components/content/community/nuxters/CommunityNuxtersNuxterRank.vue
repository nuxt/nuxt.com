<template>
  <div class="relative">
    <img v-if="size === 'lg'" src="/assets/community/nuxters/rank-1.svg" alt="rank background">
    <img v-if="size === 'md'" src="/assets/community/nuxters/rank-2-3.svg" alt="rank background">
    <img v-if="size === 'sm'" src="/assets/community/nuxters/rank-light.svg" alt="rank background" class="dark:hidden">
    <img v-if="size === 'sm'" src="/assets/community/nuxters/rank-dark.svg" alt="rank background" class="hidden dark:block">
    <span class="absolute inset-x-0 font-semibold text-center top-3" :class="labelClass">#{{ nuxter.rank }}</span>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { CommunityNuxter } from '~/types'

const props = defineProps({
  nuxter: {
    type: Object as PropType<CommunityNuxter>,
    required: true
  }
})

const size = computed(() => {
  if (props.nuxter.rank === 1) {
    return 'lg'
  } else if ([2, 3].includes(props.nuxter.rank)) {
    return 'md'
  } else {
    return 'sm'
  }
})

const labelClass = computed(() => {
  switch (size.value) {
    case 'lg':
      return 'text-3xl u-text-white'
    case 'md':
      return 'text-2xl u-text-white'
    case 'sm':
      return 'text-lg u-text-gray-900'
  }
})
</script>
