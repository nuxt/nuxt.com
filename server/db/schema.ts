import { sqliteTable, text, integer, real, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  username: text('username').notNull(),
  provider: text('provider', { enum: ['github'] }).notNull(),
  providerId: text('provider_id').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  ...timestamps
}, table => [uniqueIndex('users_provider_id_idx').on(table.provider, table.providerId)])

export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats)
}))

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  userId: text('user_id').notNull(),
  visibility: text('visibility', { enum: ['public', 'private', 'admin'] }).notNull().default('private'),
  model: text('model'),
  provider: text('provider'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  requestCount: integer('request_count').notNull().default(0),
  ...timestamps
}, table => [index('chats_user_id_idx').on(table.userId)])

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  messages: many(messages),
  votes: many(votes)
}))

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  parts: text('parts', { mode: 'json' }),
  ...timestamps
}, table => [index('messages_chat_id_idx').on(table.chatId)])

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] })
}))

export const votes = sqliteTable('votes', {
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  isUpvoted: integer('is_upvoted', { mode: 'boolean' }).notNull()
}, table => [primaryKey({ columns: [table.chatId, table.messageId] })])

export const votesRelations = relations(votes, ({ one }) => ({
  chat: one(chats, { fields: [votes.chatId], references: [chats.id] }),
  message: one(messages, { fields: [votes.messageId], references: [messages.id] })
}))

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

export const agentDailyUsage = sqliteTable('agent_daily_usage', {
  dayKey: text('day_key').primaryKey(),
  count: integer('count').notNull()
})
