<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { Chat } from '@ai-sdk/vue'

const input = defineModel<string>({ required: true })

const props = defineProps<{
  chat: Chat<UIMessage>
  currentPage: string | null
  rateLimitReached?: boolean
  usage?: { used: number, remaining: number, limit: number }
}>()

defineEmits<{
  submit: []
}>()

const contextPathLabel = computed(() => props.currentPage?.replace(/^\//, '') ?? '')
</script>

<template>
  <div class="flex flex-col w-full">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="currentPage"
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
            :title="currentPage"
          >{{ contextPathLabel }}</span>
        </div>
      </div>
    </Transition>

    <div v-if="rateLimitReached" class="flex items-center gap-2 px-4 py-3 text-sm text-muted">
      <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
      <span>Daily limit reached. Try again tomorrow.</span>
    </div>

    <UChatPrompt
      v-else
      v-model="input"
      :error="chat.error"
      placeholder="Ask anything…"
      variant="naked"
      size="sm"
      :rows="2"
      :maxrows="5"
      autofocus
      :ui="{ base: 'px-0 rounded-none' }"
      class="px-4"
      @submit="$emit('submit')"
    >
      <template #footer>
        <div class="flex items-center gap-2 text-xs text-dimmed">
          <UTooltip v-if="usage" text="Daily messages remaining">
            <span :class="usage.remaining <= 5 ? 'text-warning' : ''">
              {{ usage.remaining }}/{{ usage.limit }}
            </span>
          </UTooltip>
        </div>

        <UChatPromptSubmit
          size="sm"
          :status="chat.status"
          :disabled="chat.status === 'ready' && !input.trim()"
          @stop="chat.stop()"
          @reload="chat.regenerate()"
        />
      </template>
    </UChatPrompt>
  </div>
</template>
