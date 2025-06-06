import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rating: text('rating').notNull(),
  feedback: text('feedback'),
  path: text('path').notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull()
})
