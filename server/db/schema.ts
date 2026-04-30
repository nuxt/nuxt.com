import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rating: text('rating').notNull(),
  feedback: text('feedback'),
  path: text('path').notNull(),
  title: text('title').notNull(),
  stem: text('stem').notNull(),
  country: text('country').notNull(),
  fingerprint: text('fingerprint').notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull()
}, table => [uniqueIndex('path_fingerprint_idx').on(table.path, table.fingerprint)])

export const agentChats = sqliteTable('agent_chats', {
  id: text('id').primaryKey(),
  messages: text('messages', { mode: 'json' }).notNull().$type<AgentChatMessage[]>(),
  fingerprint: text('fingerprint').notNull(),
  model: text('model'),
  provider: text('provider'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  requestCount: integer('request_count').notNull().default(0),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull()
}, table => [index('agent_chats_fingerprint_idx').on(table.fingerprint)])

export const agentDailyUsage = sqliteTable('agent_daily_usage', {
  dayKey: text('day_key').primaryKey(),
  count: integer('count').notNull()
})

export const agentVotes = sqliteTable('agent_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chatId: text('chat_id').notNull().references(() => agentChats.id, { onDelete: 'cascade' }),
  messageId: text('message_id').notNull(),
  isUpvoted: integer('is_upvoted', { mode: 'boolean' }).notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull()
}, table => [uniqueIndex('agent_vote_chat_msg_idx').on(table.chatId, table.messageId)])
