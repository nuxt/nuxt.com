import { and, eq, gte, inArray, lt, notExists, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { feedback, users } from '#server/db/schema'
import { agentDailyUsage, chats } from '../db/schema'

const PERSONAL_DATA_RETENTION_MONTHS = 12
const AGENT_USAGE_RETENTION_DAYS = 7

interface DataRetentionOptions {
  now?: Date
  /** Rows deleted per statement. */
  batchSize?: number
  /** Statements per table per run. */
  maxBatches?: number
}

const rowid = sql`rowid`

/**
 * Deletes personal data past its retention window. Each table is drained in
 * batches of `batchSize` rows, at most `maxBatches` times per call, so a large
 * backlog is cleared over several runs.
 */
export async function purgeExpiredData<TSchema extends Record<string, unknown>>(
  database: LibSQLDatabase<TSchema>,
  { now = new Date(), batchSize = 500, maxBatches = 10 }: DataRetentionOptions = {}
) {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - PERSONAL_DATA_RETENTION_MONTHS)
  const cutoffSeconds = Math.floor(cutoff.getTime() / 1000)

  const usageCutoff = new Date(now.getTime() - AGENT_USAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const usageCutoffDay = usageCutoff.toISOString().slice(0, 10)

  async function drain(table: SQLiteTable, where: SQL | undefined): Promise<number> {
    let total = 0
    for (let batch = 0; batch < maxBatches; batch++) {
      const { rowsAffected } = await database.delete(table)
        .where(inArray(rowid, database.select({ rowid }).from(table).where(where).limit(batchSize)))
        .run()
      total += rowsAffected
      if (rowsAffected < batchSize) break
    }
    return total
  }

  const chatLastActivity = sql`coalesce(${chats.updatedAt}, ${chats.createdAt})`

  return {
    chats: await drain(chats, lt(chatLastActivity, cutoffSeconds)),
    users: await drain(users, and(
      lt(sql`coalesce(${users.lastSeenAt}, ${users.createdAt})`, cutoffSeconds),
      notExists(database.select({ id: chats.id }).from(chats).where(and(
        eq(chats.userId, users.id),
        gte(chatLastActivity, cutoffSeconds)
      )))
    )),
    feedback: await drain(feedback, lt(feedback.updatedAt, cutoff)),
    agentDailyUsage: await drain(agentDailyUsage, lt(agentDailyUsage.dayKey, usageCutoffDay))
  }
}
