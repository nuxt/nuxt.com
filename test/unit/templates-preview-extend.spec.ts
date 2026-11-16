import type { Sandbox } from '@vercel/sandbox'
import { createError, type H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PREVIEW_ADMIN_MAX_LIFETIME_MS, PREVIEW_ADMIN_TIMEOUT_MS, PREVIEW_MAX_LIFETIME_MS, PREVIEW_TIMEOUT_MS } from '../../shared/utils/templates'

const sandboxes = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@vercel/sandbox', () => ({ Sandbox: sandboxes }))

const MINUTE = 60_000
const created = Date.UTC(2026, 10, 16, 12)

function runningFor(minutes: number) {
  return { name: 'templates-preview-x', createdAt: new Date(created), expiresAt: new Date(created + minutes * MINUTE), extendTimeout: vi.fn() } as unknown as Sandbox & { extendTimeout: ReturnType<typeof vi.fn> }
}

describe('extending a live preview', () => {
  /** The reserved slot's expiry. A claim only moves it forward, like the `lt` condition; a release moves the claim back. */
  let slot = 0
  const set = vi.fn()

  beforeEach(() => {
    slot = 0
    sandboxes.get.mockReset()
    set.mockReset().mockImplementation(({ expiresAt }: { expiresAt: Date }) => ({
      where: () => ({
        returning: async () => {
          if (expiresAt.getTime() < slot) {
            slot = expiresAt.getTime()
            return [{ id: 'templates-preview-x' }]
          }
          if (slot >= expiresAt.getTime()) return []
          slot = expiresAt.getTime()
          return [{ id: 'templates-preview-x' }]
        }
      })
    }))
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('PREVIEW_TIMEOUT_MS', PREVIEW_TIMEOUT_MS)
    vi.stubGlobal('schema', { templatePreviews: { owner: 'owner', id: 'id', expiresAt: 'expires_at' } })
    vi.stubGlobal('db', { update: () => ({ set }) })
  })

  it('adds ten minutes, up to the lifetime cap, and keeps the slot reserved as long', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const fresh = runningFor(10)
    expect(await extendPreview('owner', fresh, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 20 * MINUTE, canExtend: true })
    expect(fresh.extendTimeout).toHaveBeenCalledWith(10 * MINUTE)
    expect(set).toHaveBeenCalledWith({ expiresAt: new Date(created + 21 * MINUTE) })

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
    expect(slot).toBe(created + 31 * MINUTE)
  })

  it('releases the claim when the extension fails, so a retry extends', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const sandbox = runningFor(20)
    sandbox.extendTimeout.mockRejectedValueOnce(new Error('sandbox API down'))
    sandboxes.get.mockResolvedValue(runningFor(20))
    await expect(extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).rejects.toThrow('sandbox API down')
    expect(slot).toBe(created + 21 * MINUTE)

    expect(await extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 30 * MINUTE, canExtend: false })
    expect(slot).toBe(created + 31 * MINUTE)
  })

  it('keeps the claim when a failed call still extended the sandbox', async () => {
    const { extendPreview } = await import('../../server/utils/templates/sandbox')

    const sandbox = runningFor(20)
    sandbox.extendTimeout.mockRejectedValueOnce(new Error('timed out'))
    sandboxes.get.mockResolvedValue(runningFor(30))
    expect(await extendPreview('owner', sandbox, PREVIEW_MAX_LIFETIME_MS)).toEqual({ expiresAt: created + 30 * MINUTE, canExtend: false })
    expect(slot).toBe(created + 31 * MINUTE)
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
