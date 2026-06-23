import type { UseEveAgentReturn, EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import type { ChatSessionOptions } from './types'

const agentsByChatId = new Map<string, UseEveAgentReturn<EveMessageData>>()

export interface EveAgentBindingOptions extends ChatSessionOptions {
  headers?: () => Record<string, string>
  onFinish?: (snapshot: UseEveAgentSnapshot<EveMessageData>) => void | Promise<void>
}

export function getOrCreateEveAgent(chatId: string, options?: EveAgentBindingOptions) {
  let agent = agentsByChatId.get(chatId)
  if (!agent) {
    agent = useEveAgent({
      initialSession: options?.initialSession ?? {
        continuationToken: chatId,
        streamIndex: 0
      },
      initialEvents: options?.initialEvents as never,
      headers: options?.headers,
      onFinish: (snapshot) => {
        void options?.onFinish?.(snapshot)
      }
    })
    agentsByChatId.set(chatId, agent)
  }
  return agent
}

export function removeEveAgent(chatId: string) {
  agentsByChatId.delete(chatId)
}

export function getEveAgent(chatId: string) {
  return agentsByChatId.get(chatId)
}
