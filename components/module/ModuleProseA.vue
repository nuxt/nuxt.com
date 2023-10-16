<template>
  <NuxtLink
    :href="href"
    :target="target"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import { hasProtocol, joinURL } from 'ufo'
const { data: module } = useNuxtData('module')

const props = defineProps({
  href: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    default: undefined,
    required: false
  }
})

const href = computed(() => {
  if (hasProtocol(props.href)) return props.href
  if (!module.value.github) return props.href
  return joinURL(module.value.github, 'blob', module.value.stats?.defaultBranch || 'main', props.href)
})
</script>
