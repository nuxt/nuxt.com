import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../../server/db/schema'
import { translatorsTeam } from '../../server/utils/l10n/access'
import { consumeL10nSave } from '../../server/utils/l10n/allowance'

const NOW = Date.parse('2026-11-03T10:15:00Z')

let db: ReturnType<typeof drizzle<typeof schema>>

beforeEach(async () => {
  db = drizzle(createClient({ url: ':memory:' }), { schema })
  for (const statement of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema))) {
    await db.run(statement)
  }
})

const counted = async () => (await db.select().from(schema.l10nSaves)).map(({ saves, changes }) => ({ saves, changes }))

describe('consumeL10nSave', () => {
  it('should refuse saves past the hourly allowance, per user', async () => {
    for (let index = 0; index < 60; index++) await consumeL10nSave(db, 'a', 1, NOW)
    await expect(consumeL10nSave(db, 'a', 1, NOW)).rejects.toMatchObject({ statusCode: 429 })
    await expect(consumeL10nSave(db, 'b', 1, NOW)).resolves.toBeUndefined()
    await expect(consumeL10nSave(db, 'a', 1, NOW + 3_600_000)).resolves.toBeUndefined()
  })

  it('should refuse saves past the hourly allowance of changed segments, without counting them', async () => {
    await consumeL10nSave(db, 'a', 500, NOW)
    await consumeL10nSave(db, 'a', 499, NOW)
    await expect(consumeL10nSave(db, 'a', 2, NOW)).rejects.toMatchObject({ statusCode: 429 })
    expect(await counted()).toEqual([{ saves: 2, changes: 999 }])
    await expect(consumeL10nSave(db, 'a', 1, NOW)).resolves.toBeUndefined()
    await expect(consumeL10nSave(db, 'b', 1001, NOW)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('should count concurrent saves one at a time', async () => {
    const results = await Promise.allSettled(Array.from({ length: 100 }, () => consumeL10nSave(db, 'a', 1, NOW)))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(60)
    expect(await counted()).toEqual([{ saves: 60, changes: 60 }])
  })
})

describe('translatorsTeam', () => {
  it('should name the team of a locale', () => {
    expect(translatorsTeam('fr')).toBe('translators-fr')
  })
})
