<template>
  <ProseCallout icon="i-ph-app-window">
    Read and edit a live example in
    <NuxtLink :to="to">
      {{ computedTitle }}
    </NuxtLink>.
  </ProseCallout>
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
