import { describe, expect, it, vi } from 'vitest'
import { isAdminMode } from '../../layers/nuxi/agent/lib/identity/admin-mode'

vi.mock('@vercel/global-config', () => ({
  getAll: vi.fn(async () => ({ discordChannels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'] } }))
}))

describe('isAdminMode', () => {
  it('denies when there is no auth', async () => {
    expect(await isAdminMode(null)).toBe(false)
    expect(await isAdminMode(undefined)).toBe(false)
  })

  it('grants the schedule app principal', async () => {
    expect(await isAdminMode({ principalId: 'eve:app', principalType: 'runtime' })).toBe(true)
  })

  it('grants a human Slack user', async () => {
    expect(await isAdminMode({
      issuer: 'slack:T123',
      principalId: 'slack:T123:U1',
      principalType: 'user',
      attributes: { user_id: 'U1', author_type: 'user' }
    })).toBe(true)
  })

  it('denies a Slack bot', async () => {
    expect(await isAdminMode({
      issuer: 'slack:T123',
      principalId: 'slack:T123:bot:B1',
      principalType: 'service',
      attributes: { user_id: 'B1', author_type: 'bot' }
    })).toBe(false)
  })

  it('grants a Discord user from an admin channel', async () => {
    expect(await isAdminMode({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { channel_id: 'C_ADMIN' }
    })).toBe(true)
  })

  it('denies a Discord user from a public (non-admin) channel', async () => {
    expect(await isAdminMode({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { channel_id: 'C_PUBLIC' }
    })).toBe(false)
  })

  it('denies a Discord user from a channel outside both tiers', async () => {
    expect(await isAdminMode({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { channel_id: 'C_OTHER' }
    })).toBe(false)
  })

  it('denies a Discord session with no channel claim (e.g. an unverified HITL resume)', async () => {
    expect(await isAdminMode({ issuer: 'discord', principalId: 'discord:U1', principalType: 'user', attributes: {} })).toBe(false)
  })

  it('grants a web session with the admin role', async () => {
    expect(await isAdminMode({ issuer: 'nuxt.com', principalId: 'u1', principalType: 'user', attributes: { role: 'admin' } })).toBe(true)
  })

  it('denies a web session without the admin role, identified or anonymous', async () => {
    expect(await isAdminMode({ issuer: 'nuxt.com', principalId: 'u1', principalType: 'user', attributes: { role: 'user' } })).toBe(false)
    expect(await isAdminMode({ issuer: 'nuxt.com', principalId: 'anon', principalType: 'anonymous' })).toBe(false)
  })

  it('denies an unrecognized issuer even with a stray admin role attribute (intentional hardening)', async () => {
    expect(await isAdminMode({
      issuer: 'some-future-channel',
      principalId: 'x',
      principalType: 'user',
      attributes: { role: 'admin' }
    })).toBe(false)
  })
})
