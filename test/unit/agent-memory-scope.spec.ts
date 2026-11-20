import { describe, expect, it } from 'vitest'
import { memoryOwner } from '../../layers/nuxi/agent/lib/memory'

describe('memoryOwner', () => {
  it('gives signed-in nuxt.com users memory keyed on their account', () => {
    expect(memoryOwner({ issuer: 'nuxt.com', principalId: 'acc1', principalType: 'user' })).toBe('acc1')
  })

  it('gives anonymous web visitors no memory', () => {
    expect(memoryOwner({ issuer: 'nuxt.com', principalId: 'cookie-id', principalType: 'anonymous' })).toBeNull()
  })

  it('gives Slack, including DMs, Discord and schedules no memory', () => {
    const slack = (channelId: string) => ({ issuer: 'slack:T1', principalId: 'slack:T1:U1', principalType: 'user', attributes: { user_id: 'U1', channel_id: channelId } })
    expect(memoryOwner(slack('D123'))).toBeNull()
    expect(memoryOwner(slack('C123'))).toBeNull()
    expect(memoryOwner({ issuer: 'discord', principalId: 'd1', principalType: 'user' })).toBeNull()
    expect(memoryOwner({ principalId: 'eve:app', principalType: 'runtime' })).toBeNull()
    expect(memoryOwner(null)).toBeNull()
  })
})
