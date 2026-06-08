<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'
import type { TextPasteAttachment } from '../../../shared/utils/paste-attachment'

const input = defineModel<string>({ required: true })

const props = defineProps<{
  chat: Chat<UIMessage>
  currentPage: string | null
  pageContextEnabled: boolean
  rateLimitReached?: boolean
  usage?: { used: number, remaining: number, limit: number }
  pasteAttachments?: TextPasteAttachment[]
  canSubmit?: boolean
}>()

defineEmits<{
  submit: []
  dismissPageContext: []
  addPageContext: []
  paste: [event: ClipboardEvent]
  removePasteAttachment: [index: number]
  restorePasteAttachment: [index: number]
}>()

const contextPathLabel = computed(() => props.currentPage?.replace(/^\//, '') ?? '')
</script>

<template>
  <div class="flex flex-col w-full">
    <AgentLoginHint attached />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="pageContextEnabled"
        class="flex items-center gap-2 border-b border-default px-4 py-2.5"
      >
        <div class="min-w-0 flex-1 flex items-center gap-1.5 text-xs">
          <span class="shrink-0 text-dimmed">Agent is using</span>
          <img
            src="/icon.png"
            alt=""
            class="size-3.5 shrink-0 rounded-sm opacity-90"
          >
          <span
            class="min-w-0 truncate font-medium text-highlighted"
            :title="currentPage ?? undefined"
          >{{ contextPathLabel }}</span>
        </div>
        <UTooltip text="Stop using this page as context" :kbds="['tab']">
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            class="shrink-0 text-dimmed hover:text-default -me-1"
            aria-label="Stop using this page as context"
            @click="$emit('dismissPageContext')"
          />
        </UTooltip>
      </div>
    </Transition>

    <div v-if="rateLimitReached" class="flex items-center gap-2 px-4 py-3 text-sm text-muted">
      <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
      <span>Daily limit reached. Try again tomorrow.</span>
    </div>

    <AgentChatPrompt
      v-else
      v-model="input"
      :chat="chat"
      :paste-attachments="pasteAttachments"
      :can-submit="canSubmit"
      :usage="usage"
      variant="naked"
      size="sm"
      :submit-disabled="chat.status === 'ready' && !(canSubmit ?? input.trim())"
      :ui="{ root: 'pb-2', body: 'px-0', base: 'px-0 rounded-none', header: 'px-0 pt-2 pb-0 gap-1.5 flex flex-wrap items-start', footer: 'px-0 items-baseline' }"
      @submit="$emit('submit')"
      @paste="$emit('paste', $event)"
      @remove-attachment="$emit('removePasteAttachment', $event)"
      @restore-attachment="$emit('restorePasteAttachment', $event)"
    >
      <template #footer-left>
        <div class="flex items-center gap-2 text-xs text-dimmed">
          <UTooltip v-if="currentPage && !pageContextEnabled" text="Use page as context" :kbds="['tab']">
            <UButton
              type="button"
              icon="i-lucide-file-plus"
              color="neutral"
              variant="ghost"
              size="sm"
              class="-my-1 -mx-1.5 text-dimmed hover:text-default"
              aria-label="Use page as context"
              @click.stop="$emit('addPageContext')"
            />
          </UTooltip>

          <USeparator v-if="currentPage && !pageContextEnabled" orientation="vertical" class="h-4" />

          <UTooltip v-if="usage" text="Daily messages remaining">
            <span :class="usage.remaining <= 5 ? 'text-warning' : ''">
              {{ usage.remaining }}/{{ usage.limit }}
            </span>
          </UTooltip>
        </div>
      </template>
    </AgentChatPrompt>
  </div>
</template>
