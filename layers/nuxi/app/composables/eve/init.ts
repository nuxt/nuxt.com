import type { UseEveAgentReturn, EveMessageData, UseEveAgentSnapshot } from 'eve/vue'
import type { ChatSessionOptions } from './types'

const clientAgentsByChatId = import.meta.client
  ? new Map<string, UseEveAgentReturn<EveMessageData>>()
  : null

export interface EveAgentBindingOptions extends ChatSessionOptions {
  headers?: () => Record<string, string>
  onFinish?: (snapshot: UseEveAgentSnapshot<EveMessageData>) => void | Promise<void>
}

function createAgent(chatId: string, options?: EveAgentBindingOptions) {
  return useEveAgent({
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
}

export function getOrCreateEveAgent(chatId: string, options?: EveAgentBindingOptions) {
  if (import.meta.server) {
    const state = useState<UseEveAgentReturn<EveMessageData> | undefined>(`eve-agent:${chatId}`)
    if (!state.value) {
      state.value = createAgent(chatId, options)
    }
    return state.value
  }

  let agent = clientAgentsByChatId!.get(chatId)
  if (!agent) {
    agent = createAgent(chatId, options)
    clientAgentsByChatId!.set(chatId, agent)
  }
  return agent
}

export function removeEveAgent(chatId: string) {
  if (import.meta.server) {
    useState<UseEveAgentReturn<EveMessageData> | undefined>(`eve-agent:${chatId}`).value = undefined
    return
  }
  clientAgentsByChatId?.delete(chatId)
}

export function getEveAgent(chatId: string) {
  if (import.meta.server) {
    return useState<UseEveAgentReturn<EveMessageData> | undefined>(`eve-agent:${chatId}`).value
  }
  return clientAgentsByChatId?.get(chatId)
}
