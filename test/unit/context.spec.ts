import { describe, expect, it } from 'vitest'
import { resolveContext } from '../../layers/nuxi/agent/lib/context'

describe('resolveContext', () => {
  it('returns unknown/null for no auth', () => {
    expect(resolveContext(null)).toEqual({ surface: 'unknown', person: null, channel: null, raw: {} })
    expect(resolveContext(undefined)).toEqual({ surface: 'unknown', person: null, channel: null, raw: {} })
  })

  it('resolves the schedule surface for the eve:app runtime principal, with no person or channel', () => {
    const ctx = resolveContext({ principalId: 'eve:app', principalType: 'runtime' })
    expect(ctx.surface).toBe('schedule')
    expect(ctx.person).toBeNull()
    expect(ctx.channel).toBeNull()
  })

  it('resolves a Slack human user, preferring full_name and carrying the channel', () => {
    const ctx = resolveContext({
      issuer: 'slack:T123',
      principalId: 'slack:T123:U1',
      principalType: 'user',
      attributes: { user_id: 'U1', full_name: 'Jane Doe', user_name: 'jane', channel_id: 'C1', author_type: 'user' }
    })
    expect(ctx.surface).toBe('slack')
    expect(ctx.person).toEqual({ id: 'U1', name: 'Jane Doe', isBot: false })
    expect(ctx.channel).toEqual({ id: 'C1' })
  })

  it('falls back to user_name when a Slack user has no full_name', () => {
    const ctx = resolveContext({
      issuer: 'slack',
      principalId: 'slack:U1',
      principalType: 'user',
      attributes: { user_id: 'U1', user_name: 'jane', channel_id: 'C1', author_type: 'user' }
    })
    expect(ctx.person?.name).toBe('jane')
  })

  it('flags a Slack bot author as isBot', () => {
    const ctx = resolveContext({
      issuer: 'slack:T123',
      principalId: 'slack:T123:bot:B1',
      principalType: 'service',
      attributes: { user_id: 'B1', author_type: 'bot', channel_id: 'C1' }
    })
    expect(ctx.surface).toBe('slack')
    expect(ctx.person?.isBot).toBe(true)
  })

  it('resolves a Discord user with the raw channel id', () => {
    const ctx = resolveContext({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { username: 'jane', channel_id: 'C1' }
    })
    expect(ctx.surface).toBe('discord')
    expect(ctx.person).toEqual({ id: 'discord:U1', name: 'jane', isBot: false })
    expect(ctx.channel).toEqual({ id: 'C1' })
  })

  it('resolves a Discord user with no channel claim as channel: null', () => {
    const ctx = resolveContext({
      issuer: 'discord',
      principalId: 'discord:U1',
      principalType: 'user',
      attributes: { username: 'jane' }
    })
    expect(ctx.channel).toBeNull()
  })

  it('resolves an identified web session', () => {
    const ctx = resolveContext({
      issuer: 'nuxt.com',
      principalId: 'user_1',
      principalType: 'user',
      attributes: { login: 'hugo', name: 'Hugo Richard', role: 'admin' }
    })
    expect(ctx.surface).toBe('web')
    expect(ctx.person).toEqual({ id: 'user_1', name: 'hugo', isBot: false })
    expect(ctx.channel).toBeNull()
  })

  it('resolves an anonymous web session as a person with no name', () => {
    const ctx = resolveContext({ issuer: 'nuxt.com', principalId: 'anon_1', principalType: 'anonymous', attributes: {} })
    expect(ctx.surface).toBe('web')
    expect(ctx.person).toEqual({ id: 'anon_1', name: undefined, isBot: false })
  })

  it('treats an unrecognized issuer as unknown, even with a stray role attribute', () => {
    const ctx = resolveContext({ issuer: 'some-future-channel', principalId: 'x', principalType: 'user', attributes: { role: 'admin' } })
    expect(ctx.surface).toBe('unknown')
    expect(ctx.person).toBeNull()
  })
})
