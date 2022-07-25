<template>
  <div class="flex items-center" :class="[wrapperClass]">
    <UIcon :name="icon" class="u-text-gray-600" :class="[iconSize]" />
    <div class="flex flex-col">
      <span :class="numberClass">{{ number }}</span>
      <span class="mt-1 leading-none u-text-gray-700" :class="{ 'hidden': size === 'sm' }">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { CommunityNuxter } from '~/types'

const props = defineProps({
  nuxter: {
    type: Object as PropType<CommunityNuxter>,
    required: true
  },
  size: {
    type: String,
    required: true,
    validator: (value: string) => ['lg', 'md', 'sm'].includes(value)
  },
  type: {
    type: String,
    required: true,
    validator: (value: string) => ['activities', 'pull_requests', 'issues', 'comments'].includes(value)
  }
})

const icon = computed(() => {
  switch (props.type) {
    case 'activities':
      return 'uil:heart-rate'
    case 'pull_requests':
      return 'octicon:git-pull-request-16'
    case 'issues':
      return 'octicon:issue-opened-16'
    case 'comments':
      return 'uil:comment-alt-lines'
  }
})
const number = computed(() => {
  switch (props.type) {
    case 'activities':
      return props.nuxter.activitiesCount
    case 'pull_requests':
      return props.nuxter.pullRequestsCount
    case 'issues':
      return props.nuxter.issuesCount
    case 'comments':
      return props.nuxter.commentsCount
  }
})
const numberClass = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'text-xl font-semibold u-text-gray-900 leading-none'
    case 'md':
      return 'text-xl font-semibold u-text-gray-900 leading-none'
    case 'sm':
      return 'font-semibold u-text-gray-700 leading-none'
  }
})
const label = computed(() => {
  switch (props.type) {
    case 'activities':
      return 'Activities'
    case 'pull_requests':
      return 'Pull requests'
    case 'issues':
      return 'Issues'
    case 'comments':
      return 'Comments'
  }
})
const iconSize = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'w-6 h-6'
    case 'md':
      return 'w-6 h-6'
    case 'sm':
      return 'w-4 h-4'
  }
})
const wrapperClass = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'gap-4'
    case 'md':
      return 'gap-2'
    case 'sm':
      return 'gap-2'
  }
})
</script>
