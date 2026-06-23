import type { UseEveAgentSnapshot } from 'eve/vue'
import type { EveMessageData } from 'eve/vue'
import type { UIMessage } from 'ai'
import { titleFromParts } from '../../../shared/utils/chat'
import {
  persistAnonymousTitle,
  persistChatState
} from './providers/eve/thread-state'

export interface EveChatRuntimeOptions {
  chatId: string
  getMessages: () => UIMessage[]
  loggedIn: () => boolean
  onTitle?: (title: string) => void
  onFinish?: () => void
  refreshChats?: () => Promise<void>
  patchTitle?: (chatId: string, title: string) => void
  findChatTitle?: (chatId: string) => string | null | undefined
}

export function createEveFinishHandler(options: EveChatRuntimeOptions) {
  return async (snapshot: UseEveAgentSnapshot<EveMessageData>) => {
    const agentMessages = options.getMessages()

    if (options.loggedIn()) {
      try {
        await persistChatState(options.chatId, snapshot, {
          syncMessages: true,
          messages: [...agentMessages]
        })
        await options.refreshChats?.()

        let generatedTitle = options.findChatTitle?.(options.chatId) ?? null

        if (!generatedTitle) {
          const firstUser = [...agentMessages].find(message => message.role === 'user')
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
      const firstUser = [...agentMessages].find(message => message.role === 'user')
      if (firstUser) {
        const title = titleFromParts(firstUser.parts as UIMessage['parts'])
        await persistAnonymousTitle(options.chatId, title)
        options.onTitle?.(title)
      }
    }

    options.onFinish?.()
  }
}
