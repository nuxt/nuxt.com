<script setup lang="ts">
import type { UIMessage } from 'ai'

const props = defineProps<{
  chatId: string
  initialMessages?: UIMessage[]
}>()

const {
  faqQuestions,
  usage,
  rateLimitReached,
  currentPage,
  pageContextDismissed,
  pageContextEnabled,
  consumePendingPrompt,
  nuxiMood
} = useNuxtAgent()
const { loggedIn } = useUserSession()
const { refresh: refreshChats } = useChats()

const contextPathLabel = computed(() => currentPage.value?.replace(/^\//, '') ?? '')

const {
  chat,
  input,
  prompt,
  getVote,
  vote,
  askQuestion,
  send
} = useAgentChat({
  chatId: props.chatId,
  initialMessages: props.initialMessages,
  source: 'prompt',
  withPageContext: 'when-enabled',
  onFinish: () => {
    if (loggedIn.value) refreshChats()
  }
})

watch(() => chat.status, (status) => {
  if (status === 'streaming') nuxiMood.value = 'thinking'
  else if (status === 'submitted') nuxiMood.value = 'thinking'
  else if (status === 'ready' && chat.messages.length > 0) nuxiMood.value = 'happy'
  else nuxiMood.value = 'idle'
}, { immediate: true })

onMounted(() => {
  const pendingPrompt = consumePendingPrompt()
  if (pendingPrompt) send(pendingPrompt)
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-1 flex-col">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <AgentChatMessages
        :chat="chat"
        :chat-id="chatId"
        compact
        show-faq-empty
        :faq-questions="faqQuestions"
        :get-vote="getVote"
        class="flex flex-col gap-4"
        @ask-question="askQuestion"
        @vote="vote"
      />
    </div>

    <div class="flex w-full shrink-0 flex-col border-y border-default">
      <AgentLoginHint v-if="!loggedIn" bar />

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
              @click="pageContextDismissed = true"
            />
          </UTooltip>
        </div>
      </Transition>

      <AgentRateLimitBanner v-if="rateLimitReached" variant="footer" />

      <AgentChatPrompt
        v-else
        v-model="input"
        v-bind="prompt"
        :chat="chat"
        :usage="usage"
        variant="naked"
        size="sm"
        :submit-disabled="chat.status === 'ready' && !(prompt.canSubmit ?? input.trim())"
        :ui="{ root: 'px-4 pb-2', body: 'px-0', base: 'px-0 rounded-none', header: 'px-0 pt-2 pb-0 gap-1.5 flex flex-wrap items-start', footer: 'px-0 items-baseline' }"
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
                @click.stop="pageContextDismissed = false"
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
  </div>
</template>
