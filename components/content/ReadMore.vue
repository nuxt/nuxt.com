<template>
  <Callout icon="i-ph-bookmark-simple-duotone">
    Read more in <NuxtLink :to="link" v-html="computedTitle" />.
  </Callout>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

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

// Guess title from link!
const computedTitle: ComputedRef<string> = computed(() => props.title || createBreadcrumb(props.link))
</script>
