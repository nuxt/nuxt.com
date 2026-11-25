import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TemplateHealth } from '../../shared/types/templates'
import { isWorking } from '../../shared/utils/templates'

const now = new Date('2026-11-03T12:00:00Z')
const passing = (checkedAt: string): TemplateHealth => ({
  nuxtMajor: 4,
  check: { status: 'passed', checkedAt, nuxt: '4.6.3', live: true }
})

describe('working template freshness', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(now))
  afterEach(() => vi.useRealTimers())

  it('accepts a passing daily check while the next run finishes', () => {
    expect(isWorking(passing('2026-11-03T04:00:00Z'))).toBe(true)
    expect(isWorking(passing('2026-11-02T04:00:00Z'))).toBe(true)
  })

  it('does not call an old passing check working today', () => {
    expect(isWorking(passing('2026-11-01T12:00:00Z'))).toBe(false)
    expect(isWorking(passing('2026-10-30T04:00:00Z'))).toBe(false)
  })

  it('rejects invalid or future check times', () => {
    expect(isWorking(passing('invalid'))).toBe(false)
    expect(isWorking(passing('2026-11-04T04:00:00Z'))).toBe(false)
  })

  it('still excludes failed, archived and outdated templates', () => {
    const health = passing(now.toISOString())
    expect(isWorking({ ...health, archived: true })).toBe(false)
    expect(isWorking({ ...health, nuxtMajor: 3 })).toBe(false)
    expect(isWorking({ ...health, check: { ...health.check!, status: 'failed' } })).toBe(false)
    expect(isWorking()).toBe(false)
  })
})
