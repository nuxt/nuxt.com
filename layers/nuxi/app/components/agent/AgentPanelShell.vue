<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

defineProps<{
  docked: boolean
}>()

const panelUi = {
  body: 'p-0 gap-0 overflow-hidden',
  actions: 'gap-0.5'
} as const

const slideoverUi = {
  body: 'p-0 sm:p-0 gap-0 overflow-hidden',
  header: 'min-h-(--ui-header-height) flex items-center gap-1.5 overflow-hidden border-b border-default px-4 sm:px-4',
  wrapper: 'min-w-0 flex-1',
  title: 'text-highlighted font-semibold truncate',
  actions: 'flex items-center gap-1.5 shrink-0 gap-0.5',
  close: ''
}
</script>

<template>
  <USidebar
    v-if="docked"
    v-model:open="open"
    side="right"
    rail
    :style="{ '--sidebar-width': '24rem' }"
    :ui="panelUi"
  >
    <template #title>
      <slot name="title" />
    </template>
    <template #actions>
      <slot name="actions" />
    </template>
    <template #close>
      <slot name="close" />
    </template>
    <slot />
  </USidebar>

  <USlideover
    v-else
    v-model:open="open"
    side="right"
    :style="{ '--sidebar-width': '24rem' }"
    :ui="{
      ...slideoverUi,
      content: 'w-full max-w-none sm:max-w-96 max-h-svh p-0 flex flex-col'
    }"
  >
    <template #title>
      <slot name="title" />
    </template>
    <template #actions>
      <slot name="actions" />
    </template>
    <template #close>
      <slot name="close" />
    </template>
    <template #body>
      <slot />
    </template>
  </USlideover>
</template>
