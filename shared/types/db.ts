import type { feedback, users, chats, messages, votes, agentDailyUsage } from '@nuxthub/db/schema'

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert

export type ChatMessage = typeof messages.$inferSelect
export type NewChatMessage = typeof messages.$inferInsert

export type Vote = typeof votes.$inferSelect
export type NewVote = typeof votes.$inferInsert

export type AgentDailyUsage = typeof agentDailyUsage.$inferSelect
export type NewAgentDailyUsage = typeof agentDailyUsage.$inferInsert

export type MessagePart = { type: string, text?: string }
