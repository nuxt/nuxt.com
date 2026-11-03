import { sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { createError } from 'h3'
import { l10nSaves } from '../../db/schema'

/** Saves, and segments changed across them, allowed per hour. */
export interface L10nAllowance {
  saves: number
  changes: number
}

/** What each signed-in user may save per hour. */
export const SAVE_ALLOWANCE: L10nAllowance = { saves: 60, changes: 1000 }

/** What each user outside a locale's team may suggest per hour, on top of `SAVE_ALLOWANCE`. */
export const SUGGESTION_ALLOWANCE: L10nAllowance = { saves: 20, changes: 200 }

/** What all suggestions together may take per hour, so they cannot use up the GitHub App's rate limit. */
export const SITE_SUGGESTION_ALLOWANCE: L10nAllowance = { saves: 200, changes: 2000 }

/** The `l10n_saves` key counting every suggestion. */
export const SITE_SUGGESTIONS_KEY = '*suggestions'

/** The hour `now` falls in, as hours since the epoch: how `l10n_saves` rows are keyed. */
export const saveHour = (now: number) => Math.floor(now / 3_600_000)

/**
 * Count one save of `changes` segments against `key` (a user id, or `SITE_SUGGESTIONS_KEY`), in one
 * statement so concurrent saves cannot both pass. Throws a 429 past either hourly allowance, without
 * counting the refused save.
 */
export async function consumeL10nSave<TSchema extends Record<string, unknown>>(database: LibSQLDatabase<TSchema>, key: string, changes: number, now = Date.now(), allowance = SAVE_ALLOWANCE): Promise<void> {
  const reserved = changes <= allowance.changes && await database.insert(l10nSaves)
    .values({ userId: key, hour: saveHour(now), saves: 1, changes })
    .onConflictDoUpdate({
      target: [l10nSaves.userId, l10nSaves.hour],
      set: { saves: sql`${l10nSaves.saves} + 1`, changes: sql`${l10nSaves.changes} + excluded.changes` },
      setWhere: sql`${l10nSaves.saves} < ${allowance.saves} and ${l10nSaves.changes} + excluded.changes <= ${allowance.changes}`
    })
    .returning({ saves: l10nSaves.saves })
  if (!reserved || !reserved.length) {
    throw createError({ statusCode: 429, statusMessage: 'Too many saves: try again within the hour' })
  }
}

/** Count one suggestion of `changes` segments by `userId`, against their allowance and the site's. */
export async function consumeL10nSuggestion<TSchema extends Record<string, unknown>>(database: LibSQLDatabase<TSchema>, userId: string, changes: number, now = Date.now()): Promise<void> {
  await consumeL10nSave(database, `${userId}:suggestions`, changes, now, SUGGESTION_ALLOWANCE)
  await consumeL10nSave(database, SITE_SUGGESTIONS_KEY, changes, now, SITE_SUGGESTION_ALLOWANCE)
}
