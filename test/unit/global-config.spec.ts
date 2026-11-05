import { getAll } from '@vercel/global-config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readGlobalConfig, resetGlobalConfigCache } from '../../layers/nuxi/agent/lib/global-config'

vi.mock('@vercel/global-config', () => ({ getAll: vi.fn() }))

const mockedGetAll = vi.mocked(getAll)

beforeEach(() => {
  mockedGetAll.mockReset()
  resetGlobalConfigCache()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('readGlobalConfig', () => {
  it('returns an empty result without calling the SDK when no store is configured', async () => {
    vi.stubEnv('GLOBAL_CONFIG', '')
    vi.stubEnv('EDGE_CONFIG', '')
    expect(await readGlobalConfig(['admin'])).toEqual({})
    expect(mockedGetAll).not.toHaveBeenCalled()
  })

  it('resolves to an empty result when the SDK throws synchronously', async () => {
    vi.stubEnv('GLOBAL_CONFIG', 'invalid')
    mockedGetAll.mockImplementation(() => {
      throw new Error('@vercel/global-config: Invalid connection string provided')
    })
    expect(await readGlobalConfig(['admin'])).toEqual({})
    expect(console.warn).toHaveBeenCalled()
  })
})
