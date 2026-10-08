<script setup lang="ts">
import { cloneVNode, type VNode } from 'vue'
import { hasProtocol, joinURL } from 'ufo'

const route = useRoute()
const { data: module } = useNuxtData(`module-${route.params?.slug}`)
const slots = defineSlots<{ default?: () => VNode[] }>()

function resolve(srcset: string) {
  if (hasProtocol(srcset) || !module.value?.repo) return srcset
  const repo = module.value.repo.split('#')[0]
  return joinURL('https://raw.githubusercontent.com/', repo, module.value.stats.defaultBranch, srcset)
}

const children = () => slots.default?.().map(vnode =>
  vnode.type === 'source' && vnode.props?.srcset
    ? cloneVNode(vnode, { srcset: resolve(vnode.props.srcset) })
    : vnode
)
</script>

<template>
  <picture>
    <component :is="child" v-for="(child, index) in children()" :key="index" />
  </picture>
</template>
