import type { EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import type { UIMessage } from 'ai'
import type { ChatEveState } from '../../../shared/types/chat'
import { toUIMessages } from './adapter'
import { titleFromParts } from '../../../shared/utils/chat'

export async function syncChatToDb(
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

export function persistAnonymousTitle(chatId: string, title: string) {
  if (!import.meta.client) return
  sessionStorage.setItem(`nuxi-chat-title:${chatId}`, title)
}

export function readAnonymousTitle(chatId: string): string | null {
  if (!import.meta.client) return null
  return sessionStorage.getItem(`nuxi-chat-title:${chatId}`)
}

export interface SyncChatOptions {
  chatId: string
  loggedIn: () => boolean
  refreshChats?: () => Promise<void>
  patchTitle?: (chatId: string, title: string) => void
  findChatTitle?: (chatId: string) => string | null | undefined
  onTitle?: (title: string) => void
  onFinish?: () => void
}

export function createChatSyncHandler(options: SyncChatOptions) {
  return async (snapshot: UseEveAgentSnapshot<EveMessageData>) => {
    const messages = toUIMessages(snapshot.data.messages)

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
