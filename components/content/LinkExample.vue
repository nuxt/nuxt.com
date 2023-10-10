<template>
  <Callout icon="i-ph-app-window-duotone">
    Read and edit a live example in
    <NuxtLink :to="link">
      {{ computedTitle }}
    </NuxtLink>.
  </Callout>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

const props = defineProps({
  link: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: false,
    default: ''
  }
})

const computedTitle: ComputedRef<string> = computed(() => createBreadcrumb(props.link))
</script>
