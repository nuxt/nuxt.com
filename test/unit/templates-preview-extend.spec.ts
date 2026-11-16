import type { Sandbox } from '@vercel/sandbox'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { createError, type H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as schema from '../../server/db/schema'
import { PREVIEW_ADMIN_MAX_LIFETIME_MS, PREVIEW_ADMIN_TIMEOUT_MS, PREVIEW_MAX_LIFETIME_MS, PREVIEW_TIMEOUT_MS } from '../../shared/utils/templates'

const sandboxes = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@vercel/sandbox', () => ({ Sandbox: sandboxes }))

const MINUTE = 60_000
const created = Date.UTC(2026, 10, 16, 12)

function runningFor(minutes: number) {
  return { name: 'templates-preview-x', createdAt: new Date(created), expiresAt: new Date(created + minutes * MINUTE), extendTimeout: vi.fn() } as unknown as Sandbox & { extendTimeout: ReturnType<typeof vi.fn> }
}

describe('extending a live preview', () => {
  let db: ReturnType<typeof drizzle<typeof schema>>
  const slot = async () => (await db.select().from(schema.templatePreviews))[0]?.expiresAt.getTime()

  beforeEach(async () => {
    db = drizzle(createClient({ url: ':memory:' }), { schema })
    for (const statement of await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema))) {
      await db.run(sql.raw(statement))
    }
    // Reserved as `startPreview` does: through the first ten minutes, plus a minute.
    await db.insert(schema.templatePreviews).values({ id: 'templates-preview-x', owner: 'owner', reservedAt: new Date(created), expiresAt: new Date(created + 11 * MINUTE) })
    sandboxes.get.mockReset()
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('PREVIEW_TIMEOUT_MS', PREVIEW_TIMEOUT_MS)
    vi.stubGlobal('schema', schema)
    vi.stubGlobal('db', db)
  })

  it('adds ten minutes, up to the lifetime cap, and keeps the slot reserved as long', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const fresh = runningFor(10)
    expect(await extendPreview('owner', fresh, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 20 * MINUTE, canExtend: true })
    expect(fresh.extendTimeout).toHaveBeenCalledWith(10 * MINUTE)
    expect(await slot()).toBe(created + 21 * MINUTE)

    // 25 minutes in a 30 minute cap: only 5 more, and no further extension.
    const late = runningFor(25)
    expect(await extendPreview('owner', late, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 30 * MINUTE, canExtend: false })
    expect(late.extendTimeout).toHaveBeenCalledWith(5 * MINUTE)
  })

  it('extends once when two requests read the same expiry', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const sandbox = runningFor(20)
    const results = await Promise.allSettled([extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS), extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)])
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected'])
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { statusCode: 423 } })
    expect(sandbox.extendTimeout).toHaveBeenCalledTimes(1)
    expect(await slot()).toBe(created + 31 * MINUTE)
  })

  it('extends once when concurrent requests get different limits', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    // 25 minutes in: a visitor request may add 5 minutes, an admin one 10.
    const sandbox = runningFor(25)
    const results = await Promise.allSettled([extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS), extendPreview('owner', sandbox, PREVIEW_ADMIN_MAX_LIFETIME_MS)])
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected'])
    expect(sandbox.extendTimeout).toHaveBeenCalledTimes(1)
    const [duration] = sandbox.extendTimeout.mock.calls[0]!
    expect(await slot()).toBe(created + 25 * MINUTE + duration + MINUTE)
  })

  it('extends once when a request reads the slot after another claimed it', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    // The visitor request claims the slot and is still extending when the admin request reads it, 25 minutes in.
    let finish!: () => void
    const visitor = runningFor(25)
    visitor.extendTimeout.mockReturnValue(new Promise<void>(resolve => finish = resolve))
    const first = extendPreview('owner', visitor, PREVIEW_MAX_LIFETIME_MS)
    await vi.waitFor(() => expect(visitor.extendTimeout).toHaveBeenCalled())

    const admin = runningFor(25)
    await expect(extendPreview('owner', admin, PREVIEW_ADMIN_MAX_LIFETIME_MS)).rejects.toMatchObject({ statusCode: 423 })
    expect(admin.extendTimeout).not.toHaveBeenCalled()
    finish()
    expect(await first).toEqual({ expiresAt: created + 30 * MINUTE, canExtend: false })
    expect(await slot()).toBe(created + 31 * MINUTE)
  })

  it('releases the claim when the extension fails, so a retry extends', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const sandbox = runningFor(20)
    sandbox.extendTimeout.mockRejectedValueOnce(new Error('sandbox API down'))
    sandboxes.get.mockResolvedValue(runningFor(20))
    await expect(extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).rejects.toThrow('sandbox API down')
    expect(await slot()).toBe(created + 11 * MINUTE)

    expect(await extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 30 * MINUTE, canExtend: false })
    expect(await slot()).toBe(created + 31 * MINUTE)
  })

  it('keeps the claim when a failed call still extended the sandbox', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const sandbox = runningFor(20)
    sandbox.extendTimeout.mockRejectedValueOnce(new Error('timed out'))
    sandboxes.get.mockResolvedValue(runningFor(30))
    expect(await extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 30 * MINUTE, canExtend: false })
    expect(await slot()).toBe(created + 31 * MINUTE)
  })

  it('keeps the claim when the outcome of a failed call is unknown', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const sandbox = runningFor(20)
    sandbox.extendTimeout.mockRejectedValueOnce(new Error('timed out'))
    sandboxes.get.mockRejectedValue(new Error('sandbox API down'))
    await expect(extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).rejects.toThrow('timed out')
    expect(await slot()).toBe(created + 31 * MINUTE)
  })

  it('refuses past the cap, which admins reach later', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const capped = runningFor(30)
    await expect(extendPreview('owner', capped, PREVIEW_MAX_LIFETIME_MS)).rejects.toMatchObject({ statusCode: 409 })
    expect(capped.extendTimeout).not.toHaveBeenCalled()

    expect(await extendPreview('owner', runningFor(30), PREVIEW_ADMIN_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 40 * MINUTE, canExtend: true })
  })
})

describe('preview limits', () => {
  const event = {} as H3Event
  const visitor = { timeoutMs: PREVIEW_TIMEOUT_MS, maxLifetimeMs: PREVIEW_MAX_LIFETIME_MS }

  beforeEach(() => {
    vi.stubGlobal('PREVIEW_TIMEOUT_MS', PREVIEW_TIMEOUT_MS)
    vi.stubGlobal('PREVIEW_MAX_LIFETIME_MS', PREVIEW_MAX_LIFETIME_MS)
    vi.stubGlobal('PREVIEW_ADMIN_TIMEOUT_MS', PREVIEW_ADMIN_TIMEOUT_MS)
    vi.stubGlobal('PREVIEW_ADMIN_MAX_LIFETIME_MS', PREVIEW_ADMIN_MAX_LIFETIME_MS)
  })

  it('starts admins with longer and lets them run longer, but never fails a start on the admin check', async () => {
    const { getPreviewLimits } = await import('../../server/utils/templates/sandbox')
    const signedIn = (role?: string) => vi.stubGlobal('getUserSession', async () => ({ user: role ? { role, username: 'hugorcd' } : undefined }))

    vi.stubGlobal('isAuthorizedAdmin', async () => true)
    signedIn('admin')
    expect(await getPreviewLimits(event)).toEqual({ timeoutMs: 30 * MINUTE, maxLifetimeMs: 120 * MINUTE })
    signedIn('user')
    expect(await getPreviewLimits(event)).toEqual(visitor)
    signedIn()
    expect(await getPreviewLimits(event)).toEqual(visitor)

    // The role is set at sign-in: an admin removed from the team since, or a GitHub outage, gets visitor limits.
    signedIn('admin')
    vi.stubGlobal('isAuthorizedAdmin', async () => false)
    expect(await getPreviewLimits(event)).toEqual(visitor)
    vi.stubGlobal('isAuthorizedAdmin', async () => {
      throw new Error('GitHub is down')
    })
    expect(await getPreviewLimits(event)).toEqual(visitor)
  })
})
