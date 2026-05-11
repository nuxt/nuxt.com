<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  chatId: string
  visibility: 'public' | 'private'
}>()

const emit = defineEmits<{
  'update:visibility': [visibility: 'public' | 'private']
}>()

const toast = useToast()
const clipboard = useClipboard()

const open = ref(false)
const loading = ref(false)
const copied = ref(false)

const isShared = computed(() => props.visibility === 'public')

const shareUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/chat/${props.chatId}`
})

const options = [
  {
    value: 'private' as const,
    label: 'Keep private',
    description: 'Only you can see this chat',
    icon: 'i-lucide-lock'
  },
  {
    value: 'public' as const,
    label: 'Anyone with the link',
    description: 'Anyone with the link can read this chat',
    icon: 'i-lucide-globe'
  }
]

async function updateVisibility(value: 'public' | 'private') {
  if (value === props.visibility) return

  loading.value = true
  const previous = props.visibility
  emit('update:visibility', value)

  try {
    await $fetch(`/api/chats/${props.chatId}/visibility`, {
      method: 'PATCH',
      body: { visibility: value }
    })
  } catch {
    emit('update:visibility', previous)
    toast.add({
      title: 'Failed to update visibility',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  await clipboard.copy(shareUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <UPopover v-model:open="open" :ui="{ content: 'w-80' }">
    <UButton
      :icon="isShared ? 'i-lucide-globe' : 'i-lucide-share'"
      :label="isShared ? 'Shared' : 'Share'"
      color="neutral"
      variant="ghost"
      size="sm"
    />

    <template #content>
      <div class="p-3 space-y-3">
        <div class="space-y-1">
          <p class="text-sm font-medium text-highlighted">
            Share this chat
          </p>
          <p class="text-xs text-muted">
            Choose who can see this conversation.
          </p>
        </div>

        <div class="grid gap-1">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="flex items-start gap-3 px-2 py-2 rounded-md text-left hover:bg-elevated/60 transition-colors disabled:opacity-50"
            :disabled="loading"
            @click="updateVisibility(option.value)"
          >
            <UIcon :name="option.icon" class="size-4 mt-0.5 shrink-0 text-muted" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-highlighted">{{ option.label }}</span>
                <UIcon
                  v-if="props.visibility === option.value"
                  name="i-lucide-check"
                  class="size-4 text-primary"
                />
              </div>
              <p class="text-xs text-muted mt-0.5">
                {{ option.description }}
              </p>
            </div>
          </button>
        </div>

        <div v-if="isShared" class="pt-3 border-t border-default space-y-2">
          <div class="flex items-center gap-2">
            <UInput
              :model-value="shareUrl"
              readonly
              size="sm"
              class="flex-1"
              :ui="{ base: 'truncate' }"
            />
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copied ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
              @click="copyLink"
            />
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
