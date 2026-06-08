<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{
  chatId: string
  title?: string | null
  isOwner: boolean
}>()

const emit = defineEmits<{
  'update:title': [title: string]
}>()

const { renameChat, deleteChat } = useChats()

const displayTitle = computed(() => props.title || 'Untitled')

async function rename() {
  const newTitle = await renameChat(props.chatId, props.title)
  if (newTitle) emit('update:title', newTitle)
}

const items = computed<DropdownMenuItem[][]>(() => [[
  { label: 'Rename', icon: 'i-lucide-pencil', onSelect: rename }
], [
  { label: 'Delete', icon: 'i-lucide-trash', color: 'error' as const, onSelect: () => deleteChat(props.chatId) }
]])
</script>

<template>
  <span v-if="!isOwner" class="text-sm font-medium text-highlighted truncate min-w-0 max-w-3xs">
    {{ displayTitle }}
  </span>

  <UDropdownMenu
    v-else
    :items="items"
    :content="{ align: 'end' }"
    :ui="{ content: 'min-w-44' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      trailing-icon="i-lucide-chevron-down"
      :label="displayTitle"
      :class="['group min-w-0 max-w-3xs data-[state=open]:bg-elevated', { 'text-muted': !title }]"
      :ui="{
        trailingIcon: 'text-dimmed shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-200'
      }"
    />
  </UDropdownMenu>
</template>
