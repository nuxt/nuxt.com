import type { MaybeRefOrGetter } from 'vue'
import type { AgentChatHandle } from './types'
import type { EveAgentBindingOptions } from './providers/eve/init'
import { createEveChatSession } from './providers/eve/session'
import type { UIMessage } from 'ai'

export function useChatSession(
  chatId: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<EveAgentBindingOptions | undefined>
): AgentChatHandle & {
  send: (input: string | { parts: UIMessage['parts'] }) => Promise<void>
} {
  return createEveChatSession(chatId, options)
}
