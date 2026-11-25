import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../../server/db/schema'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'
import { assertSameOrigin, translatorsTeam } from '../../server/utils/l10n/access'
import { consumeL10nSave, consumeL10nSuggestion } from '../../server/utils/l10n/allowance'

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

describe('consumeL10nSuggestion', () => {
  it('should refuse suggestions past the hourly allowance, per user', async () => {
    for (let index = 0; index < 20; index++) await consumeL10nSuggestion(db, 'a', 1, NOW)
    await expect(consumeL10nSuggestion(db, 'a', 1, NOW)).rejects.toMatchObject({ statusCode: 429 })
    await expect(consumeL10nSuggestion(db, 'a', 1, NOW + 3_600_000)).resolves.toBeUndefined()
    await expect(consumeL10nSuggestion(db, 'b', 201, NOW)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('should refuse suggestions past the hourly allowance of the site, from any user', async () => {
    for (let index = 0; index < 10; index++) {
      for (let save = 0; save < 20; save++) await consumeL10nSuggestion(db, `user-${index}`, 1, NOW)
    }
    await expect(consumeL10nSuggestion(db, 'other', 1, NOW)).rejects.toMatchObject({ statusCode: 429 })
    await expect(consumeL10nSave(db, 'other', 1, NOW)).resolves.toBeUndefined()
  })
})

describe('assertSameOrigin', () => {
  const request = (headers: Record<string, string>) => {
    const req = new IncomingMessage(new Socket())
    req.headers = headers
    return createEvent(req, new ServerResponse(req))
  }

  it('should refuse writes sent from another site or subdomain', () => {
    expect(() => assertSameOrigin(request({ 'sec-fetch-site': 'same-site' }))).toThrow(expect.objectContaining({ statusCode: 403 }))
    expect(() => assertSameOrigin(request({ 'sec-fetch-site': 'cross-site' }))).toThrow(expect.objectContaining({ statusCode: 403 }))
    expect(() => assertSameOrigin(request({ 'sec-fetch-site': 'same-origin' }))).not.toThrow()
    expect(() => assertSameOrigin(request({}))).not.toThrow()
  })
})

describe('translatorsTeam', () => {
  it('should name the team of a locale', () => {
    expect(translatorsTeam('fr')).toBe('translators-fr')
  })
})
