import type { feedback, agentChats, agentVotes, agentDailyUsage } from '@nuxthub/db/schema'

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert

export type AgentChat = typeof agentChats.$inferSelect
export type NewAgentChat = typeof agentChats.$inferInsert

export type AgentVote = typeof agentVotes.$inferSelect
export type NewAgentVote = typeof agentVotes.$inferInsert

export type AgentDailyUsage = typeof agentDailyUsage.$inferSelect
export type NewAgentDailyUsage = typeof agentDailyUsage.$inferInsert

export type AgentMessagePart = { type: string, text?: string }
export type AgentChatMessage = { id: string, role: string, parts: AgentMessagePart[] }
