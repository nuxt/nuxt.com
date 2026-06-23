import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { sqliteTable, text, integer, real, index, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from '#server/db/schema'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  visibility: text('visibility', { enum: ['public', 'private', 'admin'] }).notNull().default('private'),
  parentChatId: text('parent_chat_id').references((): AnySQLiteColumn => chats.id, { onDelete: 'set null' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  model: text('model'),
  provider: text('provider'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  requestCount: integer('request_count').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  state: text('state', { mode: 'json' }).$type<ChatEveState | null>(),
  ...timestamps
}, table => [
  index('chats_user_id_idx').on(table.userId),
  index('chats_parent_chat_id_idx').on(table.parentChatId)
])

export const chatsRelations = relations(chats, ({ many, one }) => ({
  messages: many(messages),
  votes: many(votes),
  parent: one(chats, { fields: [chats.parentChatId], references: [chats.id], relationName: 'chat_branches' }),
  branches: many(chats, { relationName: 'chat_branches' })
}))

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  parts: text('parts', { mode: 'json' }),
  model: text('model'),
  provider: text('provider'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  ...timestamps
}, table => [index('messages_chat_id_idx').on(table.chatId)])

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] })
}))

export const votes = sqliteTable('votes', {
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  isUpvoted: integer('is_upvoted', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [primaryKey({ columns: [table.chatId, table.messageId] })])

export const votesRelations = relations(votes, ({ one }) => ({
  chat: one(chats, { fields: [votes.chatId], references: [chats.id] }),
  message: one(messages, { fields: [votes.messageId], references: [messages.id] })
}))

export const agentDailyUsage = sqliteTable('agent_daily_usage', {
  userId: text('user_id').notNull(),
  dayKey: text('day_key').notNull(),
  count: integer('count').notNull().default(0),
  limitOverride: integer('limit_override')
}, table => [
  primaryKey({ columns: [table.userId, table.dayKey] }),
  index('agent_daily_usage_day_key_idx').on(table.dayKey)
])

export const agentStats = sqliteTable('agent_stats', {
  dayKey: text('day_key').notNull(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  chatsStarted: integer('chats_started').notNull().default(0),
  requestCount: integer('request_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0)
}, table => [
  primaryKey({ columns: [table.dayKey, table.userId, table.provider, table.model] }),
  index('agent_stats_day_key_idx').on(table.dayKey)
])
