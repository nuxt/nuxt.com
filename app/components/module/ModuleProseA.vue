<template>
  <NuxtLink
    :href="href"
    :target="target"
    class="inline-block mr-1 text-primary hover:text-primary/80"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import { hasProtocol, joinURL } from 'ufo'

const route = useRoute()
const { data: module } = useNuxtData(`module-${route.params?.slug}`)

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
  if (hasProtocol(props.href) || !module.value?.github) return props.href
  return joinURL(module.value.github, 'blob', module.value.stats?.defaultBranch || 'main', props.href)
})
</script>
