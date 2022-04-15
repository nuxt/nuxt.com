<template>
  <Alert icon="👉">
    Read more in <ULink :to="link" v-html="computedTitle" />.
  </Alert>
</template>

<script setup lang="ts">
import { splitByCase, upperFirst } from 'scule'

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
const computedTitle = computed(() => (props.title || props.link).split('/').filter(Boolean).map(part => splitByCase(part).map(p => upperFirst(p)).join(' ')).join(' > '))
</script>
