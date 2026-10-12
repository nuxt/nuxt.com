<script setup lang="ts">
import { cloneVNode, type VNode } from 'vue'
import { hasProtocol, joinURL } from 'ufo'

const route = useRoute()
const { data: module } = useNuxtData(`module-${route.params?.slug}`)
const slots = defineSlots<{ default?: () => VNode[] }>()

function resolve(url: string) {
  if (hasProtocol(url, { acceptRelative: true }) || !module.value?.repo) return url
  const repo = module.value.repo.split('#')[0]
  return joinURL('https://raw.githubusercontent.com/', repo, module.value.stats.defaultBranch, url)
}

const resolveSrcset = (srcset: string) => srcset.split(',').map(candidate => candidate.trim().replace(/^\S+/, resolve)).join(', ')

const children = () => slots.default?.().map(vnode =>
  vnode.type === 'source' && vnode.props?.srcset
    ? cloneVNode(vnode, { srcset: resolveSrcset(vnode.props.srcset) })
    : vnode
)
</script>

<template>
  <picture>
    <component :is="child" v-for="(child, index) in children()" :key="index" />
  </picture>
</template>
