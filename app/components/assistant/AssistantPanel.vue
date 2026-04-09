<script setup lang="ts">
import type { ToolUIPart, DynamicToolUIPart } from 'ai'
import { DefaultChatTransport, isToolUIPart, isReasoningUIPart, isTextUIPart, getToolName } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { isReasoningStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'

const { isOpen, messages, faqQuestions } = useAssistant()
const { track } = useAnalytics()
const route = useRoute()
const toast = useToast()
const input = ref('')

const indexPages = new Set(['/docs', '/blog', '/changelog'])

const currentPage = computed(() => {
  const path = route.path
  if (indexPages.has(path)) return null
  if (!path.startsWith('/docs/') && !path.startsWith('/blog/') && !path.startsWith('/changelog/')) return null
  return path
})

const pageContextAdded = ref(false)
const pageContextDismissed = ref(false)

watch(currentPage, () => {
  pageContextAdded.value = false
  pageContextDismissed.value = false
})

const showPageContext = computed(() => currentPage.value && (pageContextAdded.value || !pageContextDismissed.value))

let _skipSync = false

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: '/api/assistant'
  }),
  onError: (error: Error) => {
    let message = error.message
    if (typeof message === 'string' && message[0] === '{') {
      try {
        message = JSON.parse(message).message || message
      } catch {
        // keep original on malformed JSON
      }
    }

    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  },
  onFinish: () => {
    _skipSync = true
    messages.value = chat.messages
    nextTick(() => {
      _skipSync = false
    })
  }
})

watch(messages, (newMessages) => {
  if (_skipSync) return

  chat.messages = newMessages
  if (chat.lastMessage?.role === 'user') {
    chat.regenerate()
  }
})

const canClear = computed(() => messages.value.length > 0 || chat.messages.length > 0)

type ToolPart = ToolUIPart | DynamicToolUIPart
type ToolState = ToolPart['state']

function getToolMessage(state: ToolState, toolName: string, toolInput: Record<string, string | undefined>) {
  const searchVerb = state === 'output-available' ? 'Searched' : 'Searching'
  const readVerb = state === 'output-available' ? 'Read' : 'Reading'

  return {
    'list-pages': `${searchVerb} pages`,
    'get-page': `${readVerb} ${toolInput.path || '...'}`
  }[toolName] || `${searchVerb} ${toolName}`
}

function getToolText(part: ToolPart) {
  return getToolMessage(part.state, getToolName(part), (part.input || {}) as Record<string, string | undefined>)
}

function getToolIcon(part: ToolPart): string {
  const toolName = getToolName(part)

  return {
    'get-page': 'i-lucide-file-text'
  }[toolName] || 'i-lucide-search'
}

function getToolOutput(part: ToolPart): string | undefined {
  if (part.state !== 'output-available' || !part.output) return undefined

  const output = part.output as Record<string, unknown>

  if (getToolName(part) === 'list-pages' || getToolName(part) === 'get-page') {
    const content = (output.content ?? output) as Array<{ text?: string }> | string
    const text = typeof content === 'string' ? content : content?.map(c => c.text).filter(Boolean).join('\n') || ''
    return text.length > 500 ? `${text.slice(0, 500)}…` : text || undefined
  }

  const json = JSON.stringify(output, null, 2)
  return json.length > 500 ? `${json.slice(0, 500)}…` : json
}

function onSubmit() {
  if (!input.value.trim()) return

  track('Assistant Message Sent', { query: input.value, source: 'prompt', page: currentPage.value, withContext: pageContextAdded.value })
  const text = currentPage.value && pageContextAdded.value
    ? `[Page: ${currentPage.value}] ${input.value}`
    : input.value
  chat.sendMessage({ text })
  input.value = ''
}

function askQuestion(question: string) {
  track('Assistant FAQ Clicked', { question })
  input.value = question
  onSubmit()
}

function clearMessages() {
  track('Assistant Chat Cleared')
  if (chat.status === 'streaming') {
    chat.stop()
  }
  messages.value = []
  chat.messages = []
}

const pageContextPattern = /^\[Page: (\/[^\]]+)\]\s*/

function parseUserMessage(text: string) {
  const match = text.match(pageContextPattern)
  if (!match) return { page: null, text }
  return { page: match[1], text: text.replace(pageContextPattern, '') }
}

defineShortcuts({
  meta_i: {
    handler: () => {
      isOpen.value = !isOpen.value
    },
    usingInput: true
  },
  tab: {
    handler: () => {
      if (!currentPage.value) return
      if (showPageContext.value) {
        pageContextAdded.value = false
        pageContextDismissed.value = true
      } else {
        pageContextAdded.value = true
        pageContextDismissed.value = false
      }
    },
    usingInput: true
  }
})
</script>

<template>
  <USidebar
    v-model:open="isOpen"
    side="right"
    title="Ask AI"
    rail
    :style="{ '--sidebar-width': '24rem' }"
    :ui="{ footer: 'p-0', actions: 'gap-0.5' }"
  >
    <template #actions>
      <UTooltip v-if="canClear" text="Clear chat">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          @click="clearMessages"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close" :kbds="['meta', 'i']">
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          @click="isOpen = false"
        />
      </UTooltip>
    </template>

    <UTheme
      :ui="{
        prose: {
          p: { base: 'my-2 text-sm/6' },
          li: { base: 'my-0.5 text-sm/6' },
          ul: { base: 'my-2' },
          ol: { base: 'my-2' },
          h1: { base: 'text-xl mb-4' },
          h2: { base: 'text-lg mt-6 mb-3' },
          h3: { base: 'text-base mt-4 mb-2' },
          h4: { base: 'text-sm mt-3 mb-1.5' },
          code: { base: 'text-xs' },
          pre: { root: 'my-2', base: 'text-xs/5' },
          table: { root: 'my-2' },
          hr: { base: 'my-4' }
        }
      }"
    >
      <UChatMessages
        v-if="chat.messages.length"
        should-auto-scroll
        :messages="chat.messages"
        :status="chat.status"
        compact
        class="px-0 gap-2"
        :user="{ ui: { container: 'max-w-full' } }"
      >
        <template #indicator>
          <AssistantIndicator />
        </template>

        <template #content="{ message }">
          <template v-for="(part, index) in getMergedParts(message.parts)" :key="`${message.id}-${part.type}-${index}`">
            <UChatReasoning
              v-if="isReasoningUIPart(part)"
              :text="part.text"
              :streaming="isReasoningStreaming(message, index, chat)"
              icon="i-lucide-brain"
            >
              <AssistantComark
                :markdown="part.text"
                :streaming="isReasoningStreaming(message, index, chat)"
              />
            </UChatReasoning>

            <template v-else-if="isToolUIPart(part)">
              <UChatTool
                v-if="getToolName(part) === 'web_search'"
                :text="isToolStreaming(part) ? 'Searching the web...' : 'Searched the web'"
                :suffix="getSearchQuery(part)"
                :streaming="isToolStreaming(part)"
                chevron="leading"
              >
                <AssistantToolSources :sources="getSources(part)" />
              </UChatTool>
              <UChatTool
                v-else
                :text="getToolText(part)"
                :icon="getToolIcon(part)"
                :streaming="isToolStreaming(part)"
                chevron="leading"
              >
                <pre v-if="getToolOutput(part)" class="text-xs text-dimmed whitespace-pre-wrap break-all" v-text="getToolOutput(part)" />
              </UChatTool>
            </template>

            <template v-else-if="isTextUIPart(part) && part.text.length > 0">
              <AssistantComark
                v-if="message.role === 'assistant'"
                :markdown="part.text"
                :streaming="isReasoningStreaming(message, index, chat)"
              />
              <div v-else-if="message.role === 'user'">
                <div v-if="parseUserMessage(part.text).page" class="flex items-center gap-1.5 mb-1.5 rounded-md bg-default/10 px-2 py-1 w-fit">
                  <img src="/icon.png" alt="Nuxt" class="size-3.5 shrink-0">
                  <span class="text-xs text-default/70">{{ parseUserMessage(part.text).page?.replace('/docs/', '') }}</span>
                </div>
                <p class="whitespace-pre-wrap text-sm/6">
                  {{ parseUserMessage(part.text).text }}
                </p>
              </div>
            </template>
          </template>
        </template>
      </UChatMessages>

      <div v-else>
        <div
          v-if="!faqQuestions?.length"
          class="flex h-full flex-col items-center justify-center py-12 text-center"
        >
          <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <UIcon
              name="i-lucide-message-circle-question"
              class="size-6 text-primary"
            />
          </div>
          <h3 class="mb-2 text-base font-medium text-highlighted">
            Ask me anything
          </h3>
          <p class="max-w-xs text-sm text-muted">
            I can help you navigate the Nuxt documentation and answer your questions.
          </p>
        </div>

        <template v-else>
          <div class="flex flex-col gap-6">
            <UPageLinks
              v-for="category in faqQuestions"
              :key="category.category"
              :title="category.category"
              :links="category.items.map(item => ({ label: item, onClick: () => askQuestion(item) }))"
            />
          </div>
        </template>
      </div>
    </UTheme>

    <template #footer>
      <div class="flex flex-col w-full">
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-10"
          leave-from-class="opacity-100 max-h-10"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="showPageContext" class="flex items-center gap-2 px-4 py-2 border-b border-default overflow-hidden">
            <img src="/icon.png" alt="Nuxt" class="size-4 shrink-0">
            <span class="text-sm text-default font-medium truncate">{{ currentPage?.replace('/docs/', '') }}</span>
            <button
              class="ms-auto shrink-0 text-dimmed hover:text-default transition-colors"
              @click="pageContextAdded = false; pageContextDismissed = true"
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>
        </Transition>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          placeholder="Ask about Nuxt..."
          variant="naked"
          size="sm"
          autofocus
          :ui="{ base: 'px-0' }"
          class="px-4"
          @submit="onSubmit"
        >
          <template #footer>
            <div class="flex items-center gap-2 text-xs text-dimmed">
              <UTooltip v-if="currentPage && !showPageContext" text="Use page as context" :kbds="['tab']">
                <button
                  class="relative flex items-center py-1 px-1.5 -my-1 -mx-1.5 rounded-md text-dimmed hover:text-default hover:bg-elevated transition-colors"
                  @click="pageContextAdded = true; pageContextDismissed = false"
                >
                  <UIcon name="i-lucide-file-plus" class="size-4" />
                </button>
              </UTooltip>

              <USeparator v-if="currentPage && !showPageContext" orientation="vertical" class="h-4" />

              <div class="flex items-center gap-1.5">
                <span>Line break</span>
                <UKbd size="sm" value="shift" />
                <UKbd size="sm" value="enter" />
              </div>
            </div>

            <UChatPromptSubmit
              size="sm"
              :status="chat.status"
              :disabled="!input.trim()"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
      </div>
    </template>
  </USidebar>
</template>
