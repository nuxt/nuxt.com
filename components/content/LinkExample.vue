<template>
  <Callout icon="i-ph-app-window-duotone">
    Read and edit a live example in
    <NuxtLink :to="to">
      {{ computedTitle }}
    </NuxtLink>.
  </Callout>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

const props = defineProps({
  to: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: false,
    default: ''
  }
})

const computedTitle: ComputedRef<string> = computed(() => createBreadcrumb(props.to))
</script>
