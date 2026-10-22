import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { feedback, users } from '../../server/db/schema'
import { agentDailyUsage, chats, messages, votes } from '../../layers/nuxi/server/db/schema'
import { purgeExpiredSiteData } from '../../server/utils/data-retention'
import { purgeExpiredNuxiData } from '../../layers/nuxi/server/utils/data-retention'

const migrationsDir = new URL('../../server/db/migrations/sqlite/', import.meta.url)
const journal = JSON.parse(readFileSync(new URL('meta/_journal.json', migrationsDir), 'utf8')) as { entries: { tag: string }[] }

async function applyMigrations(client: Client, tags = journal.entries.map(entry => entry.tag)) {
  for (const tag of tags) {
    await client.executeMultiple(readFileSync(new URL(`${tag}.sql`, migrationsDir), 'utf8').replaceAll('--> statement-breakpoint', ''))
  }
}

const NOW = new Date('2026-10-14T12:00:00Z')
const RECENT = new Date('2026-09-01T00:00:00Z')
const STALE = new Date('2025-09-01T00:00:00Z')

let dir: string
let client: Client
let db: LibSQLDatabase

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nuxt-com-retention-'))
  client = createClient({ url: `file:${join(dir, 'db.sqlite')}` })
  db = drizzle(client)
})

afterEach(() => {
  client.close()
  rmSync(dir, { recursive: true, force: true })
})

function user(id: string, lastSeenAt: Date | null, createdAt = lastSeenAt ?? STALE) {
  return { id, name: id, avatar: '', username: id, provider: 'github' as const, providerId: id, lastSeenAt, createdAt }
}

async function seedChat(id: string, userId: string, updatedAt: Date | null, createdAt = updatedAt ?? STALE) {
  await db.insert(chats).values({ id, userId, updatedAt, createdAt })
  await db.insert(messages).values({ id: 'm1', chatId: id, role: 'user', parts: [], createdAt })
  await db.insert(votes).values({ chatId: id, messageId: 'm1', isUpvoted: true })
}

function feedbackRow(path: string, at: Date) {
  return { rating: 'good', path, title: path, stem: path, country: 'FR', fingerprint: path, createdAt: at, updatedAt: at }
}

describe('purgeExpiredSiteData', () => {
  beforeEach(() => applyMigrations(client))

  it('deletes accounts inactive for 12 months with their chats', async () => {
    await db.insert(users).values([
      user('inactive', STALE),
      user('active', RECENT, STALE),
      user('never-seen', null, STALE)
    ])
    await seedChat('old', 'inactive', RECENT)
    await seedChat('kept', 'active', STALE)

    const result = await purgeExpiredSiteData(db, { now: NOW })

    expect(result.users).toBe(2)
    expect((await db.select({ id: users.id }).from(users)).map(row => row.id)).toEqual(['active'])
    expect((await db.select({ id: chats.id }).from(chats)).map(row => row.id)).toEqual(['kept'])
  })

  it('deletes feedback older than 12 months', async () => {
    await db.insert(feedback).values([feedbackRow('/old', STALE), feedbackRow('/new', RECENT)])

    const result = await purgeExpiredSiteData(db, { now: NOW })

    expect(result.feedback).toBe(1)
    expect((await db.select({ path: feedback.path }).from(feedback)).map(row => row.path)).toEqual(['/new'])
  })

  it('bounds deletions per run and is safe to repeat', async () => {
    await db.insert(feedback).values(Array.from({ length: 5 }, (_, i) => feedbackRow(`/old-${i}`, STALE)))

    expect((await purgeExpiredSiteData(db, { now: NOW, batchSize: 2, maxBatches: 2 })).feedback).toBe(4)
    expect((await purgeExpiredSiteData(db, { now: NOW, batchSize: 2, maxBatches: 2 })).feedback).toBe(1)
    expect(await purgeExpiredSiteData(db, { now: NOW, batchSize: 2, maxBatches: 2 })).toEqual({ users: 0, feedback: 0 })
  })
})

describe('purgeExpiredNuxiData', () => {
  beforeEach(() => applyMigrations(client))

  it('deletes chats not updated for 12 months with their messages and votes', async () => {
    await db.insert(users).values(user('u1', RECENT))
    await seedChat('stale', 'u1', STALE)
    await seedChat('never-updated', 'u1', null, STALE)
    await seedChat('revived', 'u1', RECENT, STALE)
    await seedChat('fresh', 'u1', null, RECENT)

    const result = await purgeExpiredNuxiData(db, { now: NOW })

    expect(result.chats).toBe(2)
    expect((await db.select({ id: chats.id }).from(chats)).map(row => row.id).sort()).toEqual(['fresh', 'revived'])
    expect((await db.select().from(messages)).map(row => row.chatId).sort()).toEqual(['fresh', 'revived'])
    expect((await db.select().from(votes)).map(row => row.chatId).sort()).toEqual(['fresh', 'revived'])
  })

  it('deletes daily agent usage older than 7 days', async () => {
    await db.insert(agentDailyUsage).values([
      { userId: 'u1', dayKey: '2026-10-14', count: 3 },
      { userId: 'discord:1', dayKey: '2026-10-07', count: 1 },
      { userId: 'anon-ip:x', dayKey: '2026-10-06', count: 2 },
      { userId: 'u1', dayKey: '2025-01-01', count: 5 }
    ])

    const result = await purgeExpiredNuxiData(db, { now: NOW })

    expect(result.agentDailyUsage).toBe(2)
    expect((await db.select({ dayKey: agentDailyUsage.dayKey }).from(agentDailyUsage)).map(row => row.dayKey).sort()).toEqual(['2026-10-07', '2026-10-14'])
  })
})

describe('users.last_seen_at migration', () => {
  it('starts the inactivity window of existing accounts at migration time', async () => {
    const tags = journal.entries.map(entry => entry.tag)
    const index = tags.indexOf('0009_users_last_seen')
    await applyMigrations(client, tags.slice(0, index))
    await client.execute({
      sql: 'INSERT INTO users (id, name, avatar, username, provider, provider_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['legacy', 'legacy', '', 'legacy', 'github', 'legacy', Math.floor(STALE.getTime() / 1000)]
    })
    await applyMigrations(client, tags.slice(index))

    const migratedAt = new Date()
    expect((await purgeExpiredSiteData(db, { now: migratedAt })).users).toBe(0)

    const later = new Date(migratedAt)
    later.setUTCMonth(later.getUTCMonth() + 13)
    expect((await purgeExpiredSiteData(db, { now: later })).users).toBe(1)
  })
})
