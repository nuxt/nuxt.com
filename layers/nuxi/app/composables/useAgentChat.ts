import type { EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import type { UIMessage } from 'ai'
import type { ChatEveState } from '../../shared/types/chat'
import { getMessageTextLength } from '../../shared/utils/paste-attachment'
import {
  appendUserMessageToChat,
  createChatWithMessage,
  persistAnonymousTitle,
  readAnonymousTitle,
  titleFromParts
} from '../../shared/utils/chat'
import { eveMessagesToUIMessages } from './eve/adapter'
import { useEveChat } from './eve/useEveChat'
import { useChatVotes } from './useChatVotes'
import { usePasteAttachment } from './usePasteAttachment'

export interface UseAgentChatOptions {
  chatId: string
  initialMessages?: UIMessage[]
  initialState?: ChatEveState | null
  source: string
  withPageContext?: 'always' | 'when-enabled'
  fetchVotes?: boolean
  onFinish?: () => void
  onTitle?: (title: string) => void
}

interface SyncChatOptions {
  chatId: string
  loggedIn: () => boolean
  refreshChats?: () => Promise<void>
  patchTitle?: (chatId: string, title: string) => void
  findChatTitle?: (chatId: string) => string | null | undefined
  onTitle?: (title: string) => void
  onFinish?: () => void
}

async function syncChatToDb(
  chatId: string,
  snapshot: UseEveAgentSnapshot<EveMessageData>,
  messages: UIMessage[]
) {
  if (!snapshot.events.length) return

  const state: ChatEveState = {
    session: {
      sessionId: snapshot.session.sessionId,
      continuationToken: snapshot.session.continuationToken ?? chatId,
      streamIndex: snapshot.events.length
    },
    events: [...snapshot.events]
  }

  await $fetch(`/api/chats/${chatId}/state`, {
    method: 'PATCH',
    body: {
      state,
      messages: messages.map(message => ({
        id: message.id,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata as Record<string, unknown> | undefined
      }))
    }
  })
}

function createChatSyncHandler(options: SyncChatOptions) {
  return async (snapshot: UseEveAgentSnapshot<EveMessageData>) => {
    const messages = eveMessagesToUIMessages(snapshot.data.messages)

    if (options.loggedIn()) {
      try {
        await syncChatToDb(options.chatId, snapshot, messages)
        await refreshNuxtData(`chat-${options.chatId}`)
        await options.refreshChats?.()

        let generatedTitle = options.findChatTitle?.(options.chatId) ?? null

        if (!generatedTitle) {
          const firstUser = [...messages].find(message => message.role === 'user')
          const fallback = firstUser
            ? titleFromParts(firstUser.parts as UIMessage['parts'])
            : null
          if (fallback && fallback !== 'Untitled') {
            await $fetch(`/api/chats/${options.chatId}/title`, {
              method: 'PATCH',
              body: { title: fallback }
            })
            generatedTitle = fallback
          }
        }

        if (generatedTitle) {
          options.patchTitle?.(options.chatId, generatedTitle)
          options.onTitle?.(generatedTitle)
        }
      } catch {
        // Non-fatal sync failure
      }
    } else {
      const firstUser = [...messages].find(message => message.role === 'user')
      if (firstUser) {
        const title = titleFromParts(firstUser.parts as UIMessage['parts'])
        persistAnonymousTitle(options.chatId, title)
        options.onTitle?.(title)
      }
    }

    options.onFinish?.()
  }
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

  const input = ref('')
  const paste = usePasteAttachment(input)
  const { getVote, vote } = useChatVotes(() => options.chatId, options.fetchVotes ?? false)

  const initialDbPersistDone = ref((options.initialMessages?.length ?? 0) > 0)

  const useContext = computed(() =>
    options.withPageContext === 'always'
      ? Boolean(agent.currentPage.value)
      : agent.pageContextEnabled.value && Boolean(agent.currentPage.value)
  )

  const eveChat = useEveChat({
    chatId: options.chatId,
    initialMessages: options.initialMessages,
    initialState: options.initialState,
    headers: buildEveHeaders(options.chatId, agent, useContext),
    onFinish: createChatSyncHandler({
      chatId: options.chatId,
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

  async function persistFirstUserMessage(parts: UIMessage['parts']) {
    if (initialDbPersistDone.value) return
    initialDbPersistDone.value = true

    const metadata = {
      createdAt: new Date().toISOString(),
      ...(useContext.value && agent.currentPage.value ? { pagePath: agent.currentPage.value } : {})
    }

    try {
      if (options.initialMessages?.length) {
        await appendUserMessageToChat(options.chatId, parts, metadata)
      } else {
        await createChatWithMessage(options.chatId, parts, metadata)
      }
    } catch (error) {
      initialDbPersistDone.value = false
      throw error
    }
  }

  type SendInput = string | { parts: UIMessage['parts'] }

  async function send(inputValue: SendInput) {
    const parts = typeof inputValue === 'string'
      ? [{ type: 'text' as const, text: inputValue }]
      : inputValue.parts

    if (!parts.length || getMessageTextLength(parts) === 0 || agent.rateLimitReached.value) return

    track('Nuxi Message Sent', {
      source: options.source,
      page: agent.currentPage.value,
      withContext: useContext.value,
      queryLength: getMessageTextLength(parts)
    })

    if (loggedIn.value) {
      await persistFirstUserMessage(parts)
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
    readAnonymousTitle: () => readAnonymousTitle(options.chatId)
  }
}
