<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

type Visibility = 'public' | 'private' | 'admin'

const props = defineProps<{
  chatId: string
  visibility: Visibility
}>()

const emit = defineEmits<{
  'update:visibility': [visibility: Visibility]
}>()

const toast = useToast()
const clipboard = useClipboard()

const open = ref(false)
const loading = ref(false)
const copied = ref(false)
const advancedOpen = ref(false)

const isShared = computed(() => props.visibility === 'public')
const isAdminShared = computed(() => props.visibility === 'admin')

const shareUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/dashboard/chat/${props.chatId}`
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

async function updateVisibility(value: Visibility) {
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

function toggleAdminShare() {
  updateVisibility(isAdminShared.value ? 'private' : 'admin')
}

async function copyLink() {
  await clipboard.copy(shareUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const buttonIcon = computed(() => {
  if (isShared.value) return 'i-lucide-globe'
  if (isAdminShared.value) return 'i-lucide-shield'
  return 'i-lucide-share'
})
const buttonLabel = computed(() => {
  if (isShared.value) return 'Shared'
  if (isAdminShared.value) return 'Shared with admins'
  return 'Share'
})
</script>

<template>
  <UPopover v-model:open="open" :ui="{ content: 'w-80' }">
    <UButton
      :icon="buttonIcon"
      :label="buttonLabel"
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
              :aria-label="copied ? 'Link copied' : 'Copy link'"
              variant="subtle"
              size="sm"
              @click="copyLink"
            />
          </div>
        </div>

        <UCollapsible v-model:open="advancedOpen" class="pt-2 border-t border-default">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            block
            :ui="{ base: 'justify-start gap-1.5' }"
          >
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3.5 transition-transform"
              :class="{ 'rotate-90': advancedOpen }"
            />
            <span class="flex-1 text-left">More options</span>
            <span
              v-if="isAdminShared"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium leading-none"
            >
              <span class="size-1.5 rounded-full bg-primary" />
              Sharing
            </span>
          </UButton>

          <template #content>
            <label
              class="flex items-start gap-3 px-2 py-2 mt-1 rounded-md text-left cursor-pointer hover:bg-elevated/60 transition-colors"
              :class="{ 'opacity-50 pointer-events-none': loading }"
            >
              <UIcon name="i-lucide-shield" class="size-4 mt-0.5 shrink-0 text-muted" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-highlighted">
                  Share with Nuxt admins
                </p>
                <p class="text-xs text-muted mt-0.5">
                  For debugging — admins can open this chat from their dashboard
                </p>
              </div>
              <USwitch
                :model-value="isAdminShared"
                size="sm"
                :disabled="loading"
                class="mt-0.5 shrink-0"
                @update:model-value="toggleAdminShare"
              />
            </label>
          </template>
        </UCollapsible>
      </div>
    </template>
  </UPopover>
</template>
