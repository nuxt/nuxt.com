<template>
  <Alert icon="👉">
    Read more in <NuxtLink :to="link" v-html="computedTitle" />.
  </Alert>
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
const computedTitle: ComputedRef<string> = computed(() => createBreadcrumb(props.link))
</script>
