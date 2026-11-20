import { lt, sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { deleteInBatches, personalDataCutoff } from '#server/utils/data-retention'
import type { DataRetentionOptions } from '#server/utils/data-retention'
import { agentDailyUsage, chats } from '../db/schema'

const AGENT_USAGE_RETENTION_DAYS = 7

/** Deletes chats not updated for 12 months (messages and votes cascade) and daily agent usage older than 7 days. */
export async function purgeExpiredNuxiData<TSchema extends Record<string, unknown>>(
  database: LibSQLDatabase<TSchema>,
  options: DataRetentionOptions = {}
) {
  const now = options.now ?? new Date()
  const cutoffSeconds = Math.floor(personalDataCutoff(now).getTime() / 1000)
  const usageCutoffDay = new Date(now.getTime() - AGENT_USAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return {
    chats: await deleteInBatches(database, chats, lt(sql`coalesce(${chats.updatedAt}, ${chats.createdAt})`, cutoffSeconds), options),
    agentDailyUsage: await deleteInBatches(database, agentDailyUsage, lt(agentDailyUsage.dayKey, usageCutoffDay), options)
  }
}
