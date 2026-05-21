<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { DropdownMenuItem } from '@nuxt/ui'
import { format, isToday, isYesterday } from 'date-fns'

const props = defineProps<{
  message: UIMessage
  vote: boolean | null
  streaming?: boolean
  chatId?: string
  canRegenerate?: boolean
}>()

const emit = defineEmits<{
  vote: [message: UIMessage, isUpvoted: boolean]
  regenerate: []
}>()

const { copy, copied } = useClipboard()
const { refresh: refreshChats } = useChatsData()
const toast = useToast()

const textContent = computed(() => {
  return props.message.parts
    .filter(p => p.type === 'text')
    .map(p => (p as { text: string }).text)
    .join('\n')
})

const createdAt = computed(() => {
  const raw = (props.message.metadata as { createdAt?: string } | undefined)?.createdAt
  return raw ? new Date(raw) : null
})

const dateLabel = computed(() => {
  if (!createdAt.value) return null
  const d = createdAt.value
  const time = format(d, 'h:mm a')
  if (isToday(d)) return `Today, ${time}`
  if (isYesterday(d)) return `Yesterday, ${time}`
  return format(d, 'MMM d, yyyy, h:mm a')
})

async function branch() {
  if (!props.chatId) return
  try {
    const { id } = await $fetch<{ id: string }>(`/api/chats/${props.chatId}/branch`, {
      method: 'POST',
      body: { messageId: props.message.id }
    })
    await refreshChats()
    await navigateTo(`/dashboard/chat/${id}`)
  } catch {
    toast.add({
      description: 'Failed to branch chat',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

const moreItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[] = []
  if (dateLabel.value) {
    items.push({ type: 'label', label: dateLabel.value })
  }
  if (props.chatId) {
    items.push({
      label: 'Branch in new chat',
      icon: 'i-lucide-git-branch',
      onSelect: branch
    })
  }
  return [items]
})
</script>

<template>
  <div v-if="!streaming" class="flex items-center gap-0.5">
    <UTooltip :text="copied ? 'Copied' : 'Copy'">
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="copied ? 'Copied' : 'Copy response'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="copy(textContent)"
      />
    </UTooltip>

    <UTooltip text="Good response">
      <UButton
        icon="i-lucide-thumbs-up"
        aria-label="Mark response as helpful"
        :aria-pressed="vote === true ? 'true' : 'false'"
        :color="vote === true ? 'success' : 'neutral'"
        variant="ghost"
        size="xs"
        @click="emit('vote', message, true)"
      />
    </UTooltip>

    <UTooltip text="Bad response">
      <UButton
        icon="i-lucide-thumbs-down"
        aria-label="Mark response as not helpful"
        :aria-pressed="vote === false ? 'true' : 'false'"
        :color="vote === false ? 'error' : 'neutral'"
        variant="ghost"
        size="xs"
        @click="emit('vote', message, false)"
      />
    </UTooltip>

    <UTooltip v-if="canRegenerate" text="Regenerate">
      <UButton
        icon="i-lucide-rotate-ccw"
        aria-label="Regenerate response"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="emit('regenerate')"
      />
    </UTooltip>

    <UDropdownMenu
      v-if="moreItems[0]?.length"
      :items="moreItems"
      :content="{ align: 'start', side: 'top' }"
    >
      <UButton
        icon="i-lucide-ellipsis"
        aria-label="More options"
        color="neutral"
        variant="ghost"
        size="xs"
      />
    </UDropdownMenu>
  </div>
</template>
