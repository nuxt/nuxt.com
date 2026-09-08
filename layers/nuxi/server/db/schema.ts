import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { sqliteTable, text, integer, index, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core'
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
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  // Eve stream cursor (`{ sessionId, streamIndex }`). The column previously
  // held the full event log; only this cursor is stored now.
  state: text('state', { mode: 'json' }).$type<ChatSessionCursor | null>(),
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
  id: text('id').notNull(),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  parts: text('parts', { mode: 'json' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  ...timestamps
}, table => [
  primaryKey({ columns: [table.chatId, table.id] })
])

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] })
}))

export const votes = sqliteTable('votes', {
  chatId: text('chat_id').notNull(),
  messageId: text('message_id').notNull(),
  isUpvoted: integer('is_upvoted', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  primaryKey({ columns: [table.chatId, table.messageId] }),
  foreignKey({
    columns: [table.chatId],
    foreignColumns: [chats.id]
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.chatId, table.messageId],
    foreignColumns: [messages.chatId, messages.id]
  }).onDelete('cascade')
])

export const votesRelations = relations(votes, ({ one }) => ({
  chat: one(chats, { fields: [votes.chatId], references: [chats.id] }),
  message: one(messages, { fields: [votes.chatId, votes.messageId], references: [messages.chatId, messages.id] })
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
