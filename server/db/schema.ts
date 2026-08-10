import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email'),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  username: text('username').notNull(),
  provider: text('provider', { enum: ['github'] }).notNull(),
  providerId: text('provider_id').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  ...timestamps
}, table => [uniqueIndex('users_provider_id_idx').on(table.provider, table.providerId)])

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

export const mcpFeedback = sqliteTable('mcp_feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  toolName: text('tool_name'),
  feedback: text('feedback').notNull(),
  suggestedFix: text('suggested_fix'),
  path: text('path'),
  /** `nuxi` for the agent reporting its own gaps, `mcp` for third-party MCP clients. */
  source: text('source', { enum: ['mcp', 'nuxi'] }).notNull().default('mcp'),
  fingerprint: text('fingerprint').notNull(),
  country: text('country').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, table => [
  index('mcp_feedback_created_at_idx').on(table.createdAt),
  index('mcp_feedback_fingerprint_idx').on(table.fingerprint),
  index('mcp_feedback_source_idx').on(table.source, table.createdAt)
])

export const mcpFeedbackDailyUsage = sqliteTable('mcp_feedback_daily_usage', {
  fingerprint: text('fingerprint').notNull(),
  dayKey: text('day_key').notNull(),
  count: integer('count').notNull().default(0)
}, table => [
  primaryKey({ columns: [table.fingerprint, table.dayKey] })
])
