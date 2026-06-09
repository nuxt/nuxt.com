import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { FileUIPart, UIMessage } from 'ai'

type ChatModeOptions = {
  mode?: 'chat'
  chatId: string
  initialMessages?: UIMessage[]
  source: string
  withPageContext?: 'always' | 'when-enabled'
  fetchVotes?: boolean
  onFinish?: () => void
  onTitle?: (title: string) => void
}

type StartModeOptions = {
  mode: 'start'
  source: string
}

type UseAgentChatOptions = ChatModeOptions | StartModeOptions

function usePasteAttachment(input: Ref<string>) {
  const attachments = ref<TextPasteAttachment[]>([])

  const canSubmit = computed(() =>
    Boolean(input.value.trim() || attachments.value.length)
  )

  function handlePaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain')
    if (!text || !shouldConvertPasteToAttachment(text)) return

    event.preventDefault()
    attachments.value.push({
      content: text,
      name: guessAttachmentName(text, attachments.value.map(attachment => attachment.name))
    })
  }

  function removeAttachment(index: number) {
    attachments.value.splice(index, 1)
  }

  function restoreToInput(index: number) {
    const attachment = attachments.value[index]
    if (!attachment) return

    const content = attachment.content
    input.value = input.value.trim()
      ? `${content}\n\n${input.value.trim()}`
      : content
    attachments.value.splice(index, 1)
  }

  function clearAttachments() {
    attachments.value = []
  }

  return {
    attachments,
    canSubmit,
    handlePaste,
    removeAttachment,
    restoreToInput,
    buildMessageParts: () => buildMessageParts(input.value, attachments.value),
    clearAttachments
  }
}

function createPromptBindings(
  paste: ReturnType<typeof usePasteAttachment>,
  onSubmit: () => void | Promise<void>
) {
  return computed(() => ({
    pasteAttachments: paste.attachments.value,
    canSubmit: paste.canSubmit.value,
    onPaste: paste.handlePaste,
    onRemoveAttachment: paste.removeAttachment,
    onRestoreAttachment: paste.restoreToInput,
    onSubmit
  }))
}

function useVotes(chatId: MaybeRefOrGetter<string>, immediate = false) {
  const toast = useToast()
  const chatIdValue = computed(() => toValue(chatId))

  const { data: voteRows } = useLazyFetch<ChatVoteRow[]>(
    () => `/api/chats/${chatIdValue.value}/votes`,
    {
      immediate,
      default: () => [] as ChatVoteRow[]
    }
  )

  const votes = ref(new Map<string, boolean>())

  watch(voteRows, (rows) => {
    const map = new Map<string, boolean>()
    for (const row of (rows ?? []) as ChatVoteRow[]) {
      map.set(row.messageId, row.isUpvoted)
    }
    votes.value = map
  }, { immediate: true })

  function getRows(): ChatVoteRow[] {
    return (voteRows.value ?? []) as ChatVoteRow[]
  }

  function getVote(messageId: string): boolean | null {
    const vote = votes.value.get(messageId)
    return vote === undefined ? null : vote
  }

  function vote(message: UIMessage, isUpvoted: boolean) {
    const current = votes.value.get(message.id)
    const next = current === isUpvoted ? undefined : isUpvoted
    const snapshot = new Map(votes.value)

    if (next === undefined) votes.value.delete(message.id)
    else votes.value.set(message.id, next)
    votes.value = new Map(votes.value)

    voteRows.value = next === undefined
      ? getRows().filter(row => row.messageId !== message.id)
      : [
          ...getRows().filter(row => row.messageId !== message.id),
          { chatId: chatIdValue.value, messageId: message.id, isUpvoted: next }
        ]

    $fetch(`/api/chats/${chatIdValue.value}/votes`, {
      method: 'POST',
      body: next === undefined
        ? { messageId: message.id }
        : { messageId: message.id, isUpvoted: next }
    }).catch(() => {
      votes.value = snapshot
      voteRows.value = [...snapshot.entries()].map(([messageId, isUpvoted]) => ({
        chatId: chatIdValue.value,
        messageId,
        isUpvoted
      }))
      toast.add({ description: 'Failed to save vote', icon: 'i-lucide-alert-circle', color: 'error' })
    })
  }

  return { votes, getVote, vote }
}

export function useAgentChat(options: UseAgentChatOptions) {
  const agent = useNuxtAgent()
  const chats = useChats()
  const { loggedIn } = useUserSession()
  const { track } = useAnalytics()
  const toast = useToast()

  const input = ref('')
  const paste = usePasteAttachment(input)

  if (options.mode === 'start') {
    const loading = ref(false)

    async function createChat(parts: UIMessage['parts']) {
      if (loading.value || agent.rateLimitReached.value || getMessageTextLength(parts) === 0) return
      loading.value = true

      try {
        if (loggedIn.value) {
          const chatId = crypto.randomUUID()
          await createChatWithMessage(chatId, parts)
          await chats.refresh()
          await navigateTo(`/dashboard/chat/${chatId}`)
        } else {
          agent.pendingMessageParts.value = parts
          await navigateTo(`/dashboard/chat/${crypto.randomUUID()}`)
        }
      } catch {
        toast.add({ description: 'Failed to create chat', icon: 'i-lucide-alert-circle', color: 'error' })
      } finally {
        loading.value = false
      }
    }

    async function onSubmit() {
      if (!paste.canSubmit.value) return
      const parts = paste.buildMessageParts()
      paste.clearAttachments()
      input.value = ''
      await createChat(parts)
    }

    function createFromSuggestion(label: string) {
      return createChat(buildMessageParts(label, []))
    }

    return {
      input,
      loading,
      prompt: createPromptBindings(paste, onSubmit),
      onSubmit,
      createFromSuggestion
    }
  }

  const chatOptions = options as ChatModeOptions
  const { getVote, vote } = useVotes(() => chatOptions.chatId, chatOptions.fetchVotes ?? false)

  const useContext = computed(() =>
    chatOptions.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  const chat = new Chat<UIMessage>({
    id: chatOptions.chatId,
    messages: chatOptions.initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chats/${chatOptions.chatId}`,
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

      if (loggedIn.value) {
        const chatCache = useNuxtData<ChatDetail>(`chat-${chatOptions.chatId}`)
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
      }

      chatOptions.onFinish?.()
    },
    onData: async (part) => {
      if (part.type === 'data-chat-title') {
        const generatedTitle = (part.data as { title?: string } | undefined)?.title
        if (generatedTitle) {
          if (loggedIn.value) {
            await chats.refresh()
            const updated = chats.chatList.value?.find(c => c.id === chatOptions.chatId)
            if (updated?.title) chats.patchTitle(chatOptions.chatId, updated.title)
          } else {
            chatOptions.onTitle?.(generatedTitle)
          }
          return
        }

        if (loggedIn.value) {
          await chats.refresh()
          const updated = chats.chatList.value?.find(c => c.id === chatOptions.chatId)
          if (updated?.title) chats.patchTitle(chatOptions.chatId, updated.title)
        }
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
      source: chatOptions.source,
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
      const userMessage = await createChatWithMessage(chatOptions.chatId, parts, metadata)
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
    if (!paste.canSubmit.value) return
    const parts = paste.buildMessageParts()
    input.value = ''
    paste.clearAttachments()
    await send({ parts })
  }

  function askQuestion(question: string) {
    track('Nuxi FAQ Clicked', { question, source: chatOptions.source })
    send(question)
  }

  return {
    chat,
    input,
    prompt: createPromptBindings(paste, onSubmit),
    getVote,
    vote,
    send,
    onSubmit,
    askQuestion
  }
}
