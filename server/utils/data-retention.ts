import { inArray, lt, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { feedback, users } from '../db/schema'

const PERSONAL_DATA_RETENTION_MONTHS = 12

export interface DataRetentionOptions {
  now?: Date
  /** Rows deleted per statement. */
  batchSize?: number
  /** Statements per table per run. */
  maxBatches?: number
}

const rowid = sql`rowid`

/** Start of the window personal data is kept for, relative to `now`. */
export function personalDataCutoff(now: Date): Date {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - PERSONAL_DATA_RETENTION_MONTHS)
  return cutoff
}

/**
 * Deletes the rows of `table` matching `where`, `batchSize` rows per statement
 * and at most `maxBatches` statements, so a large backlog is cleared over
 * several runs. Returns the number of rows deleted.
 */
export async function deleteInBatches<TSchema extends Record<string, unknown>>(
  database: LibSQLDatabase<TSchema>,
  table: SQLiteTable,
  where: SQL | undefined,
  { batchSize = 500, maxBatches = 10 }: DataRetentionOptions = {}
): Promise<number> {
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

/** Deletes accounts not seen for 12 months (dependent rows cascade) and page feedback older than 12 months. */
export async function purgeExpiredSiteData<TSchema extends Record<string, unknown>>(
  database: LibSQLDatabase<TSchema>,
  options: DataRetentionOptions = {}
) {
  const cutoff = personalDataCutoff(options.now ?? new Date())

  return {
    users: await deleteInBatches(database, users, lt(sql`coalesce(${users.lastSeenAt}, ${users.createdAt})`, Math.floor(cutoff.getTime() / 1000)), options),
    feedback: await deleteInBatches(database, feedback, lt(feedback.updatedAt, cutoff), options)
  }
}
