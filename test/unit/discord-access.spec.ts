import { getAll } from '@vercel/global-config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isAdminDiscordChannel, isAllowedDiscordChannel } from '../../layers/nuxi/agent/lib/discord/access'
import { resetGlobalConfigCache } from '../../layers/nuxi/agent/lib/global-config'

vi.mock('@vercel/global-config', () => ({ getAll: vi.fn() }))

const mockedGetAll = vi.mocked(getAll)

beforeEach(() => {
  mockedGetAll.mockReset()
  resetGlobalConfigCache()
})

describe('isAllowedDiscordChannel', () => {
  it('allows both admin and public channels to dispatch', async () => {
    mockedGetAll.mockResolvedValue({ discordChannels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'] } })
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(true)
    expect(await isAllowedDiscordChannel('C_PUBLIC')).toBe(true)
  })

  it('denies a channel in neither tier', async () => {
    mockedGetAll.mockResolvedValue({ discordChannels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'] } })
    expect(await isAllowedDiscordChannel('C_OTHER')).toBe(false)
  })

  it('denies an undefined channel id', async () => {
    mockedGetAll.mockResolvedValue({ discordChannels: { admin: ['C_ADMIN'] } })
    expect(await isAllowedDiscordChannel(undefined)).toBe(false)
  })

  it('matches Chat SDK-prefixed ids (`discord:<guild>:<channel>`) against raw config ids', async () => {
    mockedGetAll.mockResolvedValue({ discordChannels: { public: ['C_PUBLIC'] } })
    expect(await isAllowedDiscordChannel('discord:G1:C_PUBLIC')).toBe(true)
  })

  it('denies everywhere when `discordChannels` is unset', async () => {
    mockedGetAll.mockResolvedValue({})
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(false)
  })

  it('denies everywhere and warns when `discordChannels` has an invalid shape', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedGetAll.mockResolvedValue({ discordChannels: { admin: 'not-an-array' } })
    expect(await isAllowedDiscordChannel('C_ADMIN')).toBe(false)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid `discordChannels`'),
      expect.anything()
    )
    warn.mockRestore()
  })
})

describe('isAdminDiscordChannel', () => {
  it('grants only admin-tier channels', async () => {
    mockedGetAll.mockResolvedValue({ discordChannels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'] } })
    expect(await isAdminDiscordChannel('C_ADMIN')).toBe(true)
    expect(await isAdminDiscordChannel('C_PUBLIC')).toBe(false)
  })
})
