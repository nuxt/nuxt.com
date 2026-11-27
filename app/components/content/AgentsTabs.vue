<script setup lang="ts">
import type { VNode } from 'vue'

/**
 * `ProseTabs` for the `/agents` page: the same `::tabs` / `:::tabs-item` markdown,
 * rendered as pill tabs with the active one in primary.
 */
const slots = defineSlots<{ default?: () => VNode[] }>()

const model = ref('0')
const rerender = ref(1)

interface Item {
  label: string
  icon?: string
  value: string
  component: VNode
}

function toItems(nodes: VNode[] = []): Item[] {
  return nodes.flatMap((node) => {
    if (typeof node.type === 'symbol') return toItems(node.children as VNode[])
    const props = (node.props ?? {}) as { label?: string, icon?: string }
    return [{ label: props.label ?? '', icon: props.icon, value: '', component: node }]
  }).map((item, index) => ({ ...item, value: String(index) }))
}

const items = computed(() => {
  void rerender.value
  return toItems(slots.default?.())
})

onBeforeUpdate(() => rerender.value++)
</script>

<template>
  <UTabs
    v-model="model"
    :items="items"
    color="neutral"
    variant="pill"
    :unmount-on-hide="false"
    class="my-0 gap-4"
    :ui="{
      list: 'bg-default ring ring-default rounded-[10px] p-1',
      trigger: 'min-h-9 px-2.5 text-sm font-medium data-[state=inactive]:text-muted data-[state=active]:text-highlighted',
      leadingIcon: 'hidden sm:inline-flex',
      label: 'whitespace-nowrap',
      indicator: 'rounded-[7px] bg-elevated shadow-none ring ring-accented'
    }"
  >
    <template #content="{ item }">
      <component :is="item.component" />
    </template>
  </UTabs>
</template>
