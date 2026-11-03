import { sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { createError } from 'h3'
import { l10nSaves } from '../../db/schema'

/** Saves per user per hour. */
const SAVES_PER_HOUR = 60

/** Changed segments per user per hour, across saves. */
const CHANGES_PER_HOUR = 1000

/** The hour `now` falls in, as hours since the epoch: how `l10n_saves` rows are keyed. */
export const saveHour = (now: number) => Math.floor(now / 3_600_000)

/**
 * Count one save of `changes` segments by `userId`, in one statement so concurrent saves cannot
 * both pass. Throws a 429 past either hourly allowance, without counting the refused save.
 */
export async function consumeL10nSave<TSchema extends Record<string, unknown>>(database: LibSQLDatabase<TSchema>, userId: string, changes: number, now = Date.now()): Promise<void> {
  const reserved = changes <= CHANGES_PER_HOUR && await database.insert(l10nSaves)
    .values({ userId, hour: saveHour(now), saves: 1, changes })
    .onConflictDoUpdate({
      target: [l10nSaves.userId, l10nSaves.hour],
      set: { saves: sql`${l10nSaves.saves} + 1`, changes: sql`${l10nSaves.changes} + excluded.changes` },
      setWhere: sql`${l10nSaves.saves} < ${SAVES_PER_HOUR} and ${l10nSaves.changes} + excluded.changes <= ${CHANGES_PER_HOUR}`
    })
    .returning({ saves: l10nSaves.saves })
  if (!reserved || !reserved.length) {
    throw createError({ statusCode: 429, statusMessage: 'Too many saves: try again within the hour' })
  }
}
