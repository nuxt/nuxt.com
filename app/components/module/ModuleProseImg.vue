<template>
  <img
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
  >
</template>

<script setup lang="ts">
import { hasProtocol, joinURL } from 'ufo'

const route = useRoute()
const { data: module } = useNuxtData(`module-${route.params?.slug}`)

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  height: {
    type: [String, Number],
    default: undefined
  }
})
const src = computed(() => {
  if (hasProtocol(props.src) || !module.value?.repo) return props.src
  const repo = module.value.repo.split('#')[0]
  return joinURL('https://raw.githubusercontent.com/', repo, module.value.stats.defaultBranch, props.src)
})
</script>
