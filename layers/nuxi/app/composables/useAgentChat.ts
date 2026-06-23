import type { UIMessage } from 'ai'
import { createEveChatSession } from './providers/eve/session'
import { getOrCreateEveAgent } from './providers/eve/init'
import { toUIMessages } from './providers/eve/adapter'
import { persistAnonymousTitle, persistChatState, readAnonymousTitle, resumeOptionsFromChat } from './providers/eve/thread-state'

type ChatModeOptions = {
  mode?: 'chat'
  chatId: string
  initialMessages?: UIMessage[]
  initialState?: ChatEveState | null
  /** Chat row already exists in DB (loaded from API or panel history). */
  persistedInDb?: boolean
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

function buildEveHeaders(
  chatId: string,
  agent: ReturnType<typeof useNuxtAgent>,
  withPageContext: ComputedRef<boolean>
) {
  return () => {
    const headers: Record<string, string> = {
      'x-nuxi-chat-id': chatId
    }

    if (withPageContext.value && agent.currentPage.value) {
      headers['x-page-path'] = agent.currentPage.value
    }

    return headers
  }
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

  const initialDbPersistDone = ref((chatOptions.initialMessages?.length ?? 0) > 0)

  async function persistFirstUserMessage(parts: UIMessage['parts']) {
    if (initialDbPersistDone.value) return

    const metadata = {
      createdAt: new Date().toISOString(),
      ...(useContext.value && agent.currentPage.value ? { pagePath: agent.currentPage.value } : {})
    }

    if (chatOptions.persistedInDb) {
      await appendUserMessageToChat(chatOptions.chatId, parts, metadata)
    } else {
      await createChatWithMessage(chatOptions.chatId, parts, metadata)
    }

    initialDbPersistDone.value = true
  }

  const useContext = computed(() =>
    chatOptions.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  const resumeOptions = computed(() => {
    if (chatOptions.initialState) {
      return resumeOptionsFromChat({ state: chatOptions.initialState })
    }
    return {}
  })

  const eveSession = createEveChatSession(() => chatOptions.chatId, () => ({
    ...resumeOptions.value,
    headers: buildEveHeaders(chatOptions.chatId, agent, useContext),
    onFinish: async (snapshot) => {
      const agentMessages = toUIMessages(getOrCreateEveAgent(chatOptions.chatId).data.value.messages)

      if (loggedIn.value) {
        try {
          await persistChatState(chatOptions.chatId, snapshot, {
            syncMessages: true,
            messages: [...agentMessages]
          })
          await chats.refresh()
          let generatedTitle = chats.chatList.value?.find(c => c.id === chatOptions.chatId)?.title ?? null

          if (!generatedTitle) {
            const firstUser = [...agentMessages].find(message => message.role === 'user')
            const fallback = firstUser
              ? titleFromParts(firstUser.parts as UIMessage['parts'])
              : null
            if (fallback && fallback !== 'Untitled') {
              await $fetch(`/api/chats/${chatOptions.chatId}/title`, {
                method: 'PATCH',
                body: { title: fallback }
              })
              generatedTitle = fallback
            }
          }

          if (generatedTitle) {
            chats.patchTitle(chatOptions.chatId, generatedTitle)
            chatOptions.onTitle?.(generatedTitle)
          }
        } catch {
          // Non-fatal sync failure
        }
      } else {
        const firstUser = [...agentMessages].find(message => message.role === 'user')
        if (firstUser) {
          const title = titleFromParts(firstUser.parts as UIMessage['parts'])
          await persistAnonymousTitle(chatOptions.chatId, title)
          chatOptions.onTitle?.(title)
        }
      }

      chatOptions.onFinish?.()
    }
  }))

  const chat = {
    get messages() {
      const live = eveSession.messages
      if (live.length > 0) return live
      return chatOptions.initialMessages ?? []
    },
    get status() {
      return eveSession.status
    },
    get error() {
      return eveSession.error
    },
    stop: eveSession.stop,
    regenerate: eveSession.regenerate
  }

  type SendInput = string | { parts: UIMessage['parts'] }

  async function send(inputValue: SendInput) {
    const parts = typeof inputValue === 'string'
      ? [{ type: 'text' as const, text: inputValue }]
      : inputValue.parts

    if (!parts.length || getMessageTextLength(parts) === 0 || agent.rateLimitReached.value) return

    track('Nuxi Message Sent', {
      source: chatOptions.source,
      page: agent.currentPage.value,
      withContext: useContext.value,
      queryLength: getMessageTextLength(parts)
    })

    if (loggedIn.value) {
      await persistFirstUserMessage(parts)
    }

    await eveSession.send(typeof inputValue === 'string' ? inputValue : { parts })
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
    askQuestion,
    readAnonymousTitle: () => readAnonymousTitle(chatOptions.chatId)
  }
}
