export interface ChatListItem {
  id: string
  title: string | null
  visibility: 'public' | 'private' | 'admin'
  createdAt: string
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
  messages: ChatMessageRow[]
}
