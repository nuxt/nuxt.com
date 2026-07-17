export interface EveSessionCursor {
  sessionId?: string
  continuationToken?: string
  streamIndex: number
}

export interface ChatEveState {
  session: EveSessionCursor
  events: unknown[]
}

export interface UIChat {
  id: string
  label: string
  icon?: string
  to?: string
  createdAt: string | Date
  updatedAt?: string | Date | null
}

export interface ChatListItem {
  id: string
  title: string | null
  visibility: 'public' | 'private' | 'admin'
  createdAt: string
  updatedAt?: string | null
}

export interface ChatVoteRow {
  chatId: string
  messageId: string
  isUpvoted: boolean
}

export interface ChatMessageRow {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: unknown[]
  createdAt: string
}

export interface ChatDetail {
  id: string
  title: string | null
  visibility: 'public' | 'private' | 'admin'
  isOwner: boolean
  createdAt: string
  state: ChatEveState | null
  messages: ChatMessageRow[]
}
