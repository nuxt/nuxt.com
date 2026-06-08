import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { FileUIPart, UIMessage } from 'ai'
import { getMessageTextLength } from '../../shared/utils/paste-attachment'
import { createChatWithMessage } from '../utils/create-chat'

interface UseAgentChatOptions {
  // Remount the consumer with `:key` when switching chats — the Chat
  // instance carries state that bleeds across conversations otherwise.
  chatId: string
  initialMessages?: UIMessage[]
  source: string
  withPageContext?: 'always' | 'when-enabled'
  fetchVotes?: boolean
  onFinish?: () => void
}

export const AGENT_CHAT_THEME = {
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
    pre: { root: 'my-2 max-w-full overflow-x-auto', base: 'text-xs/5' },
    table: { root: 'my-2' },
    hr: { base: 'my-4' }
  }
} as const

/** Overrides for UChatMessages `:user` — side/actions/items-start come from Nuxt UI defaults. */
export const AGENT_USER_MESSAGE_UI = {
  content: 'px-3 py-1.5 min-h-fit min-w-0 w-fit max-w-full',
  container: 'pb-5'
} as const

export const AGENT_USER_MESSAGE_UI_COMPACT = {
  content: 'min-w-0 w-fit max-w-full'
} as const

export function useAgentChat(options: UseAgentChatOptions) {
  const agent = useNuxtAgent()
  const chats = useChatsData()
  const { loggedIn } = useUserSession()
  const { track } = useAnalytics()

  const input = ref('')
  const {
    attachments: pasteAttachments,
    canSubmit,
    handlePaste,
    removeAttachment,
    restoreToInput,
    buildMessageParts: buildMessagePartsFromInput,
    clearAttachments
  } = useTextPasteAttachment(input)

  const { votes, getVote, vote } = useChatVotes(() => options.chatId, {
    immediate: options.fetchVotes ?? false
  })

  const useContext = computed(() =>
    options.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  const chat = new Chat<UIMessage>({
    id: options.chatId,
    messages: options.initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chats/${options.chatId}`,
      headers: () => {
        if (useContext.value && agent.currentPage.value) {
          return { 'x-page-path': agent.currentPage.value }
        }
        return {}
      }
    }),
    onFinish: () => {
      const now = new Date().toISOString()
      chat.messages = chat.messages.map((msg) => {
        if (!(msg.metadata as Record<string, unknown> | undefined)?.createdAt) {
          return { ...msg, metadata: { ...(msg.metadata as object ?? {}), createdAt: now } }
        }
        return msg
      }) as UIMessage[]
      const chatCache = useNuxtData<ChatDetail>(`chat-${options.chatId}`)
      if (chatCache.data.value) {
        chatCache.data.value = {
          ...chatCache.data.value,
          messages: chat.messages.map(m => ({
            id: m.id,
            role: m.role,
            parts: m.parts as unknown[],
            createdAt: (m.metadata as { createdAt?: string } | undefined)?.createdAt ?? now
          })) as ChatDetail['messages']
        }
      }
      options.onFinish?.()
    },
    onData: async (part) => {
      if (part.type === 'data-chat-title') {
        await chats.refresh()
        const updated = chats.chatList.value?.find(c => c.id === options.chatId)
        if (updated?.title) chats.patchTitle(options.chatId, updated.title)
      }
    }
  })

  type SendInput = string | { parts: UIMessage['parts'] }

  async function send(input: SendInput) {
    const parts = typeof input === 'string'
      ? [{ type: 'text' as const, text: input }]
      : input.parts

    if (!parts.length || getMessageTextLength(parts) === 0 || agent.rateLimitReached.value) return

    track('Nuxi Message Sent', {
      source: options.source,
      page: agent.currentPage.value,
      withContext: useContext.value,
      queryLength: getMessageTextLength(parts)
    })
    const metadata = {
      createdAt: new Date().toISOString(),
      ...(useContext.value && agent.currentPage.value ? { pagePath: agent.currentPage.value } : {})
    }

    const fileParts = parts.filter((part): part is FileUIPart => part.type === 'file')
    const text = parts
      .filter((part): part is { type: 'text', text: string } => part.type === 'text')
      .map(part => part.text)
      .join('\n')
      .trim()

    if (chat.messages.length === 0 && loggedIn.value) {
      const userMessage = await createChatWithMessage(options.chatId, parts, metadata)
      chat.messages = [userMessage]
      await chat.regenerate()
    } else if (fileParts.length && text) {
      await chat.sendMessage({ text, files: fileParts, metadata })
    } else if (fileParts.length) {
      await chat.sendMessage({ files: fileParts, metadata })
    } else {
      await chat.sendMessage({ text, metadata })
    }
    agent.onMessageSent()
  }

  async function onSubmit() {
    if (!canSubmit.value) return
    const parts = buildMessagePartsFromInput()
    input.value = ''
    clearAttachments()
    await send({ parts })
  }

  function askQuestion(question: string) {
    track('Nuxi FAQ Clicked', { question, source: options.source })
    send(question)
  }

  const canClear = computed(() => chat.messages.length > 0)

  return {
    chat,
    input,
    pasteAttachments,
    canSubmit,
    handlePaste,
    removeAttachment,
    restoreToInput,
    votes,
    getVote,
    vote,
    send,
    canClear,
    onSubmit,
    askQuestion
  }
}
