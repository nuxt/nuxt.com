import type { UseEveAgentSnapshot } from 'eve/vue'
import type { EveMessageData } from 'eve/vue'
import type { UIMessage } from 'ai'
import type { ChatEveState, ChatDetail } from '../../../../shared/types/chat'
import type { ChatSessionOptions } from './types'

export function resumeOptionsFromChat(chat: Pick<ChatDetail, 'state'>): ChatSessionOptions {
  const events = chat.state?.events
  if (!events?.length) {
    return {}
  }

  const session = chat.state?.session ?? { streamIndex: 0 }

  return {
    initialSession: {
      ...session,
      streamIndex: Math.max(session.streamIndex ?? 0, events.length)
    },
    initialEvents: events
  }
}

export async function persistChatState(
  chatId: string,
  snapshot: UseEveAgentSnapshot<EveMessageData>,
  options?: {
    syncMessages?: boolean
    messages?: UIMessage[]
  }
) {
  if (!snapshot.events.length) {
    return
  }

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
      ...(options?.syncMessages && options.messages?.length
        ? {
            messages: options.messages.map(message => ({
              id: message.id,
              role: message.role,
              parts: message.parts,
              metadata: message.metadata as Record<string, unknown> | undefined
            }))
          }
        : {})
    }
  })
}

export async function persistAnonymousTitle(chatId: string, title: string) {
  if (!import.meta.client) return
  sessionStorage.setItem(`nuxi-chat-title:${chatId}`, title)
}

export function readAnonymousTitle(chatId: string): string | null {
  if (!import.meta.client) return null
  return sessionStorage.getItem(`nuxi-chat-title:${chatId}`)
}
