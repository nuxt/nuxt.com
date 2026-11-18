<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { AgentChatHandle } from '../../composables/eve/types'
import { isBetweenSteps, resolveChatDisplayState } from '../../composables/eve/adapter'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  chat: AgentChatHandle
  chatId: string
  compact?: boolean
  showFaqEmpty?: boolean
  faqQuestions?: FaqCategory[]
  showUserTimestamps?: boolean
  showActions?: boolean
  spacingOffset?: number
  getVote: (messageId: string) => boolean | null
}>(), {
  compact: false,
  showFaqEmpty: false,
  faqQuestions: () => [],
  showUserTimestamps: false,
  showActions: true,
  spacingOffset: 0
})

const emit = defineEmits<{
  askQuestion: [question: string]
  vote: [message: UIMessage, isUpvoted: boolean]
}>()

// `ToolsFeedbackCard` sends it with the report so the server can attach this chat's transcript.
provide('chat-id', toRef(props, 'chatId'))

const display = computed(() =>
  resolveChatDisplayState(props.chat.messages, props.chat.status)
)

const revealingMessages = reactive(new Set<string>())
const liveMessages = reactive(new Set<string>())
watch([() => props.chat.messages.at(-1)?.id, () => props.chat.status], ([id, status], [previousId, previousStatus]) => {
  if (id === previousId || ![status, previousStatus].some(value => value === 'submitted' || value === 'streaming')) return
  const message = props.chat.messages.at(-1)
  if (message?.role !== 'assistant') return
  liveMessages.add(message.id)
  if (message.parts.some(part => part.type === 'text' && part.text.length > 0)) revealingMessages.add(message.id)
})
watch(() => props.chatId, () => {
  liveMessages.clear()
  revealingMessages.clear()
})
function onMessagePending(id: string, pending: boolean) {
  if (pending) revealingMessages.add(id)
  else revealingMessages.delete(id)
}

/**
 * Mounted after a short delay, so the pause between the final text and the end of the turn
 * does not flash an indicator under every answer.
 */
const betweenStepsMessageId = ref<string>()
let betweenStepsTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => isBetweenSteps(props.chat.messages, props.chat.status) ? props.chat.messages.at(-1)?.id : undefined,
  (id) => {
    clearTimeout(betweenStepsTimer)
    if (!id) {
      betweenStepsMessageId.value = undefined
      return
    }
    betweenStepsTimer = setTimeout(() => {
      betweenStepsMessageId.value = id
    }, 400)
  }
)

onBeforeUnmount(() => clearTimeout(betweenStepsTimer))

function isAssistantPending(message: UIMessage): boolean {
  if (message.role !== 'assistant') return false
  if (revealingMessages.has(message.id)) return true

  const { status, messages } = props.chat
  if (status !== 'submitted' && status !== 'streaming') return false

  const last = messages.at(-1)
  return last?.role === 'assistant' && message.id === last.id
}

const messagesRoot = useTemplateRef<{ $el: HTMLElement }>('messagesRoot')
const reducedMotion = usePreferredReducedMotion()
const avatarTransitionName = computed(() => props.compact ? 'nuxi-panel-avatar' : 'nuxi-avatar')
const showConversation = ref(!!display.value.displayMessages.length)

// Capture only the welcome-to-conversation swap; streaming stays outside the transition.
watch(() => !!display.value.displayMessages.length, (hasMessages) => {
  if (!props.compact || !props.showFaqEmpty || !import.meta.client || reducedMotion.value === 'reduce' || !document.startViewTransition) {
    showConversation.value = hasMessages
    return
  }

  const transition = document.startViewTransition(async () => {
    showConversation.value = hasMessages
    await nextTick()
  })
  void transition.ready.catch(() => {})
  onWatcherCleanup(() => transition.skipTransition())
})

function scrollMessages(to: 'top' | 'bottom') {
  if (!display.value.displayMessages.length) return

  let node = messagesRoot.value?.$el
  while (node && node !== document.documentElement) {
    if (/auto|scroll/.test(getComputedStyle(node).overflowY)) {
      node.scrollTo({ top: to === 'top' ? 0 : node.scrollHeight, behavior: reducedMotion.value === 'reduce' ? 'instant' : 'smooth' })
      return
    }
    node = node.parentElement
  }
}

defineShortcuts({
  home: { handler: () => scrollMessages('top') },
  end: { handler: () => scrollMessages('bottom') }
})
</script>

<template>
  <UTheme :ui="AGENT_CHAT_THEME">
    <UChatMessages
      v-if="showConversation"
      ref="messagesRoot"
      v-bind="$attrs"
      should-auto-scroll
      :messages="display.displayMessages"
      :status="chat.status === 'ready' && revealingMessages.size ? 'streaming' : display.displayStatus"
      :compact="compact"
      :spacing-offset="spacingOffset"
      :class="compact ? 'gap-2 px-0' : 'flex-1 pt-4 pb-4 sm:pb-6'"
      :user="{ ui: compact ? AGENT_USER_MESSAGE_UI_COMPACT : AGENT_USER_MESSAGE_UI }"
      :assistant="{ ui: { body: 'flex-1', content: '[text-wrap:wrap]', actions: 'ps-10 has-data-[state=open]:opacity-100 focus-within:opacity-100' } }"
      :ui="{ root: '[overflow-anchor:none]' }"
    >
      <template #indicator>
        <AgentIndicator avatar :avatar-transition-name="avatarTransitionName" />
      </template>

      <template #content="{ message }">
        <div v-if="message.role === 'assistant'" class="flex items-start gap-3">
          <span
            class="sticky top-4 grid size-7 shrink-0 self-start place-items-center"
            :style="display.displayStatus !== 'submitted' && message.id === chat.messages.at(-1)?.id ? { viewTransitionName: avatarTransitionName } : undefined"
            aria-hidden="true"
          >
            <AgentNuxiIcon
              :mood="isAssistantPending(message) ? 'thinking' : 'happy'"
              :interactive="false"
              class="h-6 w-7 text-default"
              :class="!isAssistantPending(message) && '[&_.nuxi-body]:animate-none'"
            />
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-3">
            <ChatContent
              :message="message"
              :animate="liveMessages.has(message.id)"
              :preparing="message.id === betweenStepsMessageId && !revealingMessages.has(message.id)"
              :streaming="(chat.status === 'submitted' || chat.status === 'streaming') && message.id === chat.messages.at(-1)?.id"
              :show-follow-ups="message.id === chat.messages.at(-1)?.id && chat.status === 'ready' && !isAssistantPending(message)"
              @pending="onMessagePending(message.id, $event)"
              @follow-up="emit('askQuestion', $event)"
            />
          </div>
        </div>
        <ChatContent v-else :message="message" />
      </template>

      <template v-if="showActions" #actions="{ message }">
        <ChatMessageActions
          v-if="message.role === 'assistant'"
          :message="message"
          :vote="getVote(message.id)"
          :streaming="isAssistantPending(message)"
          :chat-id="chatId"
          :can-regenerate="message.id === chat.messages.at(-1)?.id && chat.status === 'ready'"
          @vote="(msg, isUpvoted) => emit('vote', msg, isUpvoted)"
          @regenerate="chat.regenerate()"
        />
        <UTooltip
          v-else-if="showUserTimestamps && message.role === 'user' && messageTime(message)"
          :text="messageFullTime(message)!"
          :content="{ side: 'bottom' }"
        >
          <span class="text-xs text-dimmed select-none">{{ messageTime(message) }}</span>
        </UTooltip>
      </template>
    </UChatMessages>

    <div v-else-if="showFaqEmpty" v-bind="$attrs" class="flex flex-col">
      <div class="relative h-48 overflow-hidden rounded-lg mx-1">
        <LazyAgentShader />
        <span class="absolute bottom-4 left-1/2 grid size-12 -translate-x-1/2 place-items-center" :style="{ viewTransitionName: avatarTransitionName }" aria-hidden="true">
          <AgentNuxiIcon class="size-full text-default" />
        </span>
      </div>

      <div class="flex flex-col gap-6 mt-6">
        <UPageLinks
          v-for="category in faqQuestions"
          :key="category.category"
          :title="category.category"
          :links="category.items.map(item => ({ label: item, onClick: () => emit('askQuestion', item) }))"
        />
      </div>
    </div>
  </UTheme>
</template>
