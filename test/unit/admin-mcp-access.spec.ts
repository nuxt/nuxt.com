import { beforeAll, describe, expect, it } from 'vitest'
import { canAccessAdminMcp } from '../../layers/nuxi/agent/lib/admin-mcp-access'

// `isAllowedDiscordChannel` caches DISCORD_ALLOWED_CHANNELS on first read, so
// this has to be set before any test that resolves a Discord context.
beforeAll(() => {
  process.env.DISCORD_ALLOWED_CHANNELS = 'C_ALLOWED'
})

describe('canAccessAdminMcp', () => {
  it('denies when there is no auth', () => {
    expect(canAccessAdminMcp(null)).toBe(false)
    expect(canAccessAdminMcp(undefined)).toBe(false)
  })

  it('grants the schedule app principal', () => {
    expect(canAccessAdminMcp({ principalId: 'eve:app', principalType: 'runtime' })).toBe(true)
  })

  it('grants a human Slack user', () => {
    expect(canAccessAdminMcp({
      issuer: 'slack:T123',
      principalId: 'slack:T123:U1',
      principalType: 'user',
      attributes: { user_id: 'U1', author_type: 'user' }
    })).toBe(true)
  })

  it('denies a Slack bot', () => {
    expect(canAccessAdminMcp({
      issuer: 'slack:T123',
      principalId: 'slack:T123:bot:B1',
      principalType: 'service',
      attributes: { user_id: 'B1', author_type: 'bot' }
    })).toBe(false)
  })

  it('grants a Discord user from an allowed channel', () => {
    expect(canAccessAdminMcp({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { channel_id: 'C_ALLOWED' }
    })).toBe(true)
  })

  it('denies a Discord user from a channel outside the allowlist', () => {
    expect(canAccessAdminMcp({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { channel_id: 'C_OTHER' }
    })).toBe(false)
  })

  it('denies a Discord session with no channel claim (e.g. an unverified HITL resume)', () => {
    expect(canAccessAdminMcp({ issuer: 'discord', principalId: 'discord:U1', principalType: 'user', attributes: {} })).toBe(false)
  })

  it('grants a web session with the admin role', () => {
    expect(canAccessAdminMcp({ issuer: 'nuxt.com', principalId: 'u1', principalType: 'user', attributes: { role: 'admin' } })).toBe(true)
  })

  it('denies a web session without the admin role, identified or anonymous', () => {
    expect(canAccessAdminMcp({ issuer: 'nuxt.com', principalId: 'u1', principalType: 'user', attributes: { role: 'user' } })).toBe(false)
    expect(canAccessAdminMcp({ issuer: 'nuxt.com', principalId: 'anon', principalType: 'anonymous' })).toBe(false)
  })

  it('denies an unrecognized issuer even with a stray admin role attribute (intentional hardening)', () => {
    expect(canAccessAdminMcp({
      issuer: 'some-future-channel',
      principalId: 'x',
      principalType: 'user',
      attributes: { role: 'admin' }
    })).toBe(false)
  })
})
