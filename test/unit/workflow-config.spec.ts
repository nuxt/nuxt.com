import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readGlobalConfig } from '../../layers/nuxi/agent/lib/global-config'
import { loadWorkflowConfig } from '../../layers/nuxi/agent/lib/workflow/config'
import { resolveSinceDays, skillWorkflowMessage } from '../../layers/nuxi/agent/lib/workflow/shared'

vi.mock('../../layers/nuxi/agent/lib/global-config', () => ({ readGlobalConfig: vi.fn() }))

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('configured workflow day window', () => {
  it.each([7.5, 0.5, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, '7'])('falls back for invalid configured days %s', async (sinceDays) => {
    vi.mocked(readGlobalConfig).mockResolvedValue({ workflow: { sinceDays } })
    expect(await loadWorkflowConfig()).toEqual({})
    const days = await resolveSinceDays(undefined)
    expect(days).toBe(7)
    expect(skillWorkflowMessage('showcase-discovery', days)).toContain('for the last 7 days.')
    expect(console.warn).toHaveBeenCalled()
  })

  it('preserves positive integer windows and the existing cap', async () => {
    vi.mocked(readGlobalConfig).mockResolvedValue({ workflow: { sinceDays: 28, manualTrigger: true } })
    expect(await loadWorkflowConfig()).toEqual({ sinceDays: 28, manualTrigger: true })
    expect(await resolveSinceDays(undefined)).toBe(28)
    vi.mocked(readGlobalConfig).mockResolvedValue({ workflow: { sinceDays: 1000 } })
    expect(await resolveSinceDays(undefined)).toBe(365)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('preserves the default and explicit override precedence', async () => {
    vi.mocked(readGlobalConfig).mockResolvedValue({})
    expect(await resolveSinceDays(undefined)).toBe(7)
    vi.mocked(readGlobalConfig).mockResolvedValue({ workflow: { sinceDays: 28 } })
    expect(await resolveSinceDays(14)).toBe(14)
    expect(await resolveSinceDays(undefined, 21)).toBe(21)
  })
})
