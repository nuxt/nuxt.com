import type { EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import type { UIMessage } from 'ai'
import { getMessageTextLength } from '../../shared/utils/paste-attachment'
import {
  appendUserMessageToChat,
  createChatWithMessage,
  persistAnonymousTitle,
  readAnonymousTitle,
  titleFromParts
} from '../../shared/utils/chat'
import {
  clearNavigationChatId,
  consumeFreshChat,
  patchChatDetailCache,
  seedChatDetailCache,
  uiMessagesToRows
} from './useChatDetail'
import { eveMessagesToUIMessages, hasVisibleParts } from './eve/adapter'
import { useEveChat } from './eve/useEveChat'
import { usePasteAttachment } from './usePasteAttachment'

export type NuxiChatSendInput = string | { parts: UIMessage['parts'], persist?: boolean }

export interface UseNuxiChatOptions {
  chatId: MaybeRefOrGetter<string>
  initialMessages?: MaybeRefOrGetter<UIMessage[] | undefined>
  /** Fallback when no `data` ref is provided (e.g. the agent panel). */
  sessionCursor?: ChatSessionCursor | null
  source: string
  withPageContext?: 'always' | 'when-enabled'
  fetchVotes?: MaybeRefOrGetter<boolean>
  onFinish?: () => void
  onTitle?: (title: string) => void
  data?: Ref<ChatDetail | null | undefined>
  dataStatus?: Ref<string>
  isOwner?: Ref<boolean>
  consumePendingPrompt?: () => string | null
  consumePendingMessageParts?: () => UIMessage['parts'] | null
  onAnonymousTitle?: (parts: UIMessage['parts']) => void
  redirectIfAnonymousEmpty?: () => void
}

interface SyncChatOptions {
  chatId: () => string
  loggedIn: () => boolean
  refreshChats?: () => Promise<void>
  patchTitle?: (chatId: string, title: string) => void
  findChatTitle?: (chatId: string) => string | null | undefined
  onTitle?: (title: string) => void
  onFinish?: () => void
}

/** User messages are persisted at send time — only assistant output needs syncing. */
async function syncChatToDb(id: string, messages: UIMessage[], session?: { sessionId?: string, streamIndex: number }) {
  const assistantMessages = messages.filter(
    message => message.role === 'assistant' && hasVisibleParts(message.parts)
  )
  const cursor = session?.sessionId
    ? { sessionId: session.sessionId, streamIndex: session.streamIndex }
    : undefined

  if (!assistantMessages.length && !cursor) return

  await $fetch(`/api/chats/${id}/sync`, {
    method: 'POST',
    body: {
      messages: assistantMessages.map(message => ({
        id: message.id,
        role: 'assistant' as const,
        parts: message.parts,
        metadata: message.metadata as Record<string, unknown> | undefined
      })),
      session: cursor
    }
  })
  return cursor
}

function createChatSyncHandler(options: SyncChatOptions) {
  return async (snapshot: UseEveAgentSnapshot<EveMessageData>) => {
    const messages = eveMessagesToUIMessages(snapshot.data.messages)

    if (options.loggedIn()) {
      try {
        const id = options.chatId()
        const cursor = await syncChatToDb(id, messages, snapshot.session)
        patchChatDetailCache(id, {
          messages: uiMessagesToRows(messages.filter(message => message.role === 'assistant')),
          ...(cursor ? { sessionCursor: cursor } : {})
        })
        await options.refreshChats?.()

        let generatedTitle = options.findChatTitle?.(id) ?? null

        if (!generatedTitle) {
          const firstUser = [...messages].find(message => message.role === 'user')
          const fallback = firstUser
            ? titleFromParts(firstUser.parts as UIMessage['parts'])
            : null
          if (fallback && fallback !== 'Untitled') {
            await $fetch(`/api/chats/${id}/title`, {
              method: 'PATCH',
              body: { title: fallback }
            })
            generatedTitle = fallback
          }
        }

        if (generatedTitle) {
          options.patchTitle?.(id, generatedTitle)
          options.onTitle?.(generatedTitle)
        }
      } catch {
        // Non-fatal sync failure
      }
    } else {
      const firstUser = [...messages].find(message => message.role === 'user')
      if (firstUser) {
        const title = titleFromParts(firstUser.parts as UIMessage['parts'])
        persistAnonymousTitle(options.chatId(), title)
        options.onTitle?.(title)
      }
    }

    options.onFinish?.()
  }
}

function buildEveHeaders(
  chatId: MaybeRefOrGetter<string>,
  agent: ReturnType<typeof useNuxtAgent>,
  withPageContext: ComputedRef<boolean>
) {
  return () => {
    const headers: Record<string, string> = {
      'x-nuxi-chat-id': toValue(chatId)
    }

    if (withPageContext.value && agent.currentPage.value) {
      headers['x-page-path'] = agent.currentPage.value
    }

    return headers
  }
}

function useChatVotes(chatId: MaybeRefOrGetter<string>, fetchVotes: MaybeRefOrGetter<boolean> = false) {
  const toast = useToast()
  const chatIdValue = computed(() => toValue(chatId))
  const shouldFetch = computed(() => toValue(fetchVotes))

  const { data: voteRows, execute } = useLazyFetch<ChatVoteRow[]>(
    () => `/api/chats/${chatIdValue.value}/votes`,
    {
      immediate: false,
      default: () => [] as ChatVoteRow[]
    }
  )

  watch(shouldFetch, (next) => {
    if (next) void execute()
  }, { immediate: true })

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

function needsGeneration(messages: ChatMessageRow[]) {
  const last = messages[messages.length - 1]
  if (last?.role !== 'user') return false

  // A trailing user row whose turn already has its assistant reply (legacy
  // turn-derived ids) was answered — regenerating would replay the prompt.
  if (last.id.endsWith(':user')) {
    const turnPrefix = last.id.slice(0, -':user'.length)
    if (messages.some(message => message.id === `${turnPrefix}:assistant`)) return false
  }

  return true
}

export function chatDetailForResume(
  chatId: string,
  initialMessages: UIMessage[] | undefined,
  fetched?: ChatDetail | null
): ChatDetail | undefined {
  if (fetched) return fetched
  if (!initialMessages?.length) return undefined

  const rows: ChatMessageRow[] = uiMessagesToRows(initialMessages)

  if (!needsGeneration(rows)) return undefined

  return {
    id: chatId,
    title: null,
    visibility: 'private',
    isOwner: true,
    createdAt: new Date().toISOString(),
    sessionCursor: null,
    messages: rows
  }
}

export function setupStaleChatRefresh(options: {
  chatId: MaybeRefOrGetter<string>
  data: Ref<ChatDetail | null | undefined>
  status: Ref<string>
  refresh: (opts?: { force?: boolean }) => Promise<void>
}) {
  onMounted(() => {
    const id = toValue(options.chatId)
    if (!id) return
    if (consumeFreshChat(id)) return

    const cached = options.data.value
    if (!cached || options.status.value !== 'success') return

    // `force` bypasses the detail cache, which would just return the stale entry.
    const looksIncomplete = needsGeneration(cached.messages)
    if (looksIncomplete) void options.refresh({ force: true })
  })
}

function resumeChatSession(options: {
  chat: ReturnType<typeof useNuxiChat>['chat']
  send: ReturnType<typeof useNuxiChat>['send']
  hasAgentUser: ReturnType<typeof useNuxiChat>['hasAgentUser']
  data: Ref<ChatDetail | null | undefined>
  loggedIn: Ref<boolean>
  isOwner: Ref<boolean>
  consumePendingPrompt: () => string | null
  consumePendingMessageParts: () => UIMessage['parts'] | null
  markTrailingUserResent: () => void
  onAnonymousTitle?: (parts: UIMessage['parts']) => void
  redirectIfAnonymousEmpty?: () => void
}) {
  if (!options.loggedIn.value) {
    const pendingParts = options.consumePendingMessageParts()
    const pendingPrompt = options.consumePendingPrompt()

    if (!pendingParts && !pendingPrompt) {
      options.redirectIfAnonymousEmpty?.()
      return
    }

    if (pendingParts) {
      options.onAnonymousTitle?.(pendingParts)
      void options.send({ parts: pendingParts })
      return
    }

    if (pendingPrompt) void options.send({ parts: [{ type: 'text', text: pendingPrompt }] })
    return
  }

  const messages = options.data.value?.messages ?? []

  if (options.isOwner.value && needsGeneration(messages)) {
    if (options.chat.status === 'submitted' || options.chat.status === 'streaming') return

    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user')
    if (!lastUserMessage) return

    // The live projection will render the re-sent prompt — hide the persisted copy.
    options.markTrailingUserResent()

    if (options.hasAgentUser()) {
      void options.chat.regenerate()
    } else {
      void options.send({ parts: lastUserMessage.parts as UIMessage['parts'], persist: false })
    }
    return
  }

  const pendingParts = options.consumePendingMessageParts()
  if (pendingParts) {
    void options.send({ parts: pendingParts })
    return
  }

  const pendingPrompt = options.consumePendingPrompt()
  if (pendingPrompt) void options.send({ parts: [{ type: 'text', text: pendingPrompt }] })
}

export function useNuxiChat(options: UseNuxiChatOptions) {
  const agent = useNuxtAgent()
  const chats = useChats()
  const { loggedIn } = useUserSession()
  const { track } = useAnalytics()
  const toast = useToast()
  const chatId = computed(() => toValue(options.chatId))
  // `false` only in local `--ui-only` dev mode, where the Eve runtime is not spawned.
  const eveEnabled = useRuntimeConfig().public.eveEnabled !== false

  const input = ref('')
  const paste = usePasteAttachment(input)
  const { getVote, vote } = useChatVotes(chatId, () => toValue(options.fetchVotes) ?? false)

  const chatExistsInDb = ref((toValue(options.initialMessages)?.length ?? 0) > 0)

  watch(
    () => toValue(options.initialMessages)?.length ?? 0,
    (length) => {
      if (length > 0) chatExistsInDb.value = true
    }
  )

  const useContext = computed(() =>
    options.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  // When the resume flow re-sends a trailing unanswered user message, the live
  // projection renders it — hide the persisted copy from the seed.
  const trailingUserResent = ref(false)

  const seedMessages = computed(() => {
    const rows = toValue(options.initialMessages) ?? []
    if (trailingUserResent.value && rows.at(-1)?.role === 'user') return rows.slice(0, -1)
    return rows
  })

  const eveChat = useEveChat({
    chatId: options.chatId,
    initialMessages: seedMessages,
    sessionCursor: options.data?.value?.sessionCursor ?? options.sessionCursor ?? null,
    headers: buildEveHeaders(options.chatId, agent, useContext),
    onFinish: createChatSyncHandler({
      chatId: () => chatId.value,
      loggedIn: () => loggedIn.value,
      refreshChats: () => chats.refresh(),
      patchTitle: (id, title) => chats.patchTitle(id, title),
      findChatTitle: id => chats.chatList.value?.find(c => c.id === id)?.title ?? null,
      onTitle: options.onTitle,
      onFinish: options.onFinish
    })
  })

  const chat = {
    get messages() {
      return eveChat.messages
    },
    get status() {
      return eveChat.status
    },
    get error() {
      return eveChat.error
    },
    stop: eveChat.stop,
    regenerate: eveChat.regenerate
  }

  async function persistUserMessage(parts: UIMessage['parts']) {
    const metadata = {
      createdAt: new Date().toISOString(),
      ...(useContext.value && agent.currentPage.value ? { pagePath: agent.currentPage.value } : {})
    }

    if (!chatExistsInDb.value) {
      const detail = await createChatWithMessage(chatId.value, parts, metadata)
      seedChatDetailCache(chatId.value, detail)
      chatExistsInDb.value = true
      return
    }

    const message = await appendUserMessageToChat(chatId.value, parts, metadata)
    patchChatDetailCache(chatId.value, { messages: uiMessagesToRows([message]) })
  }

  async function send(inputValue: NuxiChatSendInput) {
    const parts = typeof inputValue === 'string'
      ? [{ type: 'text' as const, text: inputValue }]
      : inputValue.parts
    const persist = typeof inputValue === 'string' || inputValue.persist !== false

    if (!eveEnabled || !parts.length || getMessageTextLength(parts) === 0 || agent.rateLimitReached.value) return

    track('Nuxi Message Sent', {
      source: options.source,
      page: agent.currentPage.value,
      withContext: useContext.value,
      queryLength: getMessageTextLength(parts)
    })

    if (loggedIn.value && persist) {
      try {
        await persistUserMessage(parts)
      } catch {
        toast.add({
          description: 'Failed to save message',
          icon: 'i-lucide-alert-circle',
          color: 'error'
        })
      }
    }

    await eveChat.send(typeof inputValue === 'string' ? inputValue : { parts })
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
    track('Nuxi FAQ Clicked', { question, source: options.source })
    send(question)
  }

  const isOwner = options.isOwner ?? computed(() => loggedIn.value)
  const resumeDone = ref(false)

  const resumeData = computed(() => chatDetailForResume(
    chatId.value,
    toValue(options.initialMessages),
    options.data?.value
  ))

  watch(
    [() => options.data?.value, () => options.dataStatus?.value, loggedIn, chatId],
    () => {
      if (resumeDone.value) return
      if (!chatId.value) return
      if (loggedIn.value && options.dataStatus?.value !== 'success') return

      resumeDone.value = true
      resumeChatSession({
        chat,
        send,
        hasAgentUser: () => eveChat.hasAgentMessage('user'),
        data: options.data ?? resumeData,
        loggedIn,
        isOwner,
        consumePendingPrompt: options.consumePendingPrompt ?? (() => null),
        consumePendingMessageParts: options.consumePendingMessageParts ?? (() => null),
        markTrailingUserResent: () => {
          trailingUserResent.value = true
        },
        onAnonymousTitle: options.onAnonymousTitle,
        redirectIfAnonymousEmpty: options.redirectIfAnonymousEmpty
      })
      clearNavigationChatId()
    },
    { immediate: true }
  )

  return {
    chat,
    input,
    prompt: paste.prompt,
    getVote,
    vote,
    send,
    onSubmit,
    askQuestion,
    handlePaste: paste.handlePaste,
    removeAttachment: paste.removeAttachment,
    restoreToInput: paste.restoreToInput,
    hasAgentUser: () => eveChat.hasAgentMessage('user'),
    readAnonymousTitle: () => readAnonymousTitle(chatId.value)
  }
}
