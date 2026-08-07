import { getAll } from '@vercel/global-config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isAdminDiscordChannel, isAllowedDiscordChannel, isAutoRespondDiscordChannel } from '../../layers/nuxi/agent/lib/discord/access'
import { resetGlobalConfigCache } from '../../layers/nuxi/agent/lib/global-config'

vi.mock('@vercel/global-config', () => ({ getAll: vi.fn() }))

const mockedGetAll = vi.mocked(getAll)

beforeEach(() => {
  mockedGetAll.mockReset()
  resetGlobalConfigCache()
})

describe('isAllowedDiscordChannel', () => {
  it('allows admin, public, and autoRespond channels to dispatch', async () => {
    mockedGetAll.mockResolvedValue({
      discord: { channels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'], autoRespond: ['C_AUTO'] } }
    })
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(true)
    expect(await isAllowedDiscordChannel('C_PUBLIC')).toBe(true)
    expect(await isAllowedDiscordChannel('C_AUTO')).toBe(true)
  })

  it('denies a channel in neither tier', async () => {
    mockedGetAll.mockResolvedValue({ discord: { channels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'] } } })
    expect(await isAllowedDiscordChannel('C_OTHER')).toBe(false)
  })

  it('denies an undefined channel id', async () => {
    mockedGetAll.mockResolvedValue({ discord: { channels: { admin: ['C_ADMIN'] } } })
    expect(await isAllowedDiscordChannel(undefined)).toBe(false)
  })

  it('matches Chat SDK-prefixed ids (`discord:<guild>:<channel>`) against raw config ids', async () => {
    mockedGetAll.mockResolvedValue({ discord: { channels: { public: ['C_PUBLIC'] } } })
    expect(await isAllowedDiscordChannel('discord:G1:C_PUBLIC')).toBe(true)
  })

  it('denies everywhere when `discord` is unset', async () => {
    mockedGetAll.mockResolvedValue({})
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(false)
  })

  it('denies everywhere and warns when `discord` has an invalid shape', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedGetAll.mockResolvedValue({ discord: { channels: { admin: 'not-an-array' } } })
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(false)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid `discord`'),
      expect.anything()
    )
    warn.mockRestore()
  })

  it('denies everywhere and warns on unknown discord keys (strict schema)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedGetAll.mockResolvedValue({ discord: { channels: { admin: ['C_ADMIN'] }, typoChannel: 'x' } })
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(false)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid `discord`'),
      expect.anything()
    )
    warn.mockRestore()
  })
})

describe('isAdminDiscordChannel', () => {
  it('grants only admin-tier channels', async () => {
    mockedGetAll.mockResolvedValue({
      discord: { channels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'], autoRespond: ['C_AUTO'] } }
    })
    expect(await isAdminDiscordChannel('C_ADMIN')).toBe(true)
    expect(await isAdminDiscordChannel('C_PUBLIC')).toBe(false)
    expect(await isAdminDiscordChannel('C_AUTO')).toBe(false)
  })
})

describe('isAutoRespondDiscordChannel', () => {
  it('grants only autoRespond-tier channels', async () => {
    mockedGetAll.mockResolvedValue({
      discord: { channels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'], autoRespond: ['C_AUTO'] } }
    })
    expect(await isAutoRespondDiscordChannel('C_AUTO')).toBe(true)
    expect(await isAutoRespondDiscordChannel('C_ADMIN')).toBe(false)
    expect(await isAutoRespondDiscordChannel('C_PUBLIC')).toBe(false)
  })
})
