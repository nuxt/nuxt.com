import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TEMPLATE_SNAPSHOT_TTL_MS } from '../../server/utils/templates/check-report'
import { hasLiveSnapshot } from '../../server/utils/templates/checks'

vi.mock('workflow/api', () => ({ start: vi.fn() }))
vi.mock('../../server/workflows/check-templates', () => ({ checkTemplatesWorkflow: vi.fn() }))

const now = new Date('2026-11-03T12:00:00Z')
const row = { status: 'passed' as const, snapshotId: 'snap_live', passedAt: now }

describe('live snapshot availability', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(now))
  afterEach(() => vi.useRealTimers())

  it('accepts a recent passing snapshot', () => {
    expect(hasLiveSnapshot(row)).toBe(true)
  })

  it('rejects snapshots at the expiry margin', () => {
    const expiry = now.getTime() - TEMPLATE_SNAPSHOT_TTL_MS + 60 * 60 * 1000
    expect(hasLiveSnapshot({ ...row, passedAt: new Date(expiry + 1) })).toBe(true)
    expect(hasLiveSnapshot({ ...row, passedAt: new Date(expiry) })).toBe(false)
  })

  it('rejects failed, missing and invalid snapshots', () => {
    expect(hasLiveSnapshot({ ...row, status: 'failed' })).toBe(false)
    expect(hasLiveSnapshot({ ...row, snapshotId: null })).toBe(false)
    expect(hasLiveSnapshot({ ...row, passedAt: null })).toBe(false)
    expect(hasLiveSnapshot({ ...row, passedAt: new Date('invalid') })).toBe(false)
    expect(hasLiveSnapshot({ ...row, passedAt: new Date(now.getTime() + 1) })).toBe(false)
  })
})
