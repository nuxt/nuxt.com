import type { UIMessage } from 'ai'

export type AgentChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export interface AgentChatHandle {
  messages: UIMessage[]
  status: AgentChatStatus
  error?: Error
  stop: () => void
  regenerate: () => Promise<void>
}
