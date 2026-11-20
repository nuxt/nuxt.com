import { describe, expect, it } from 'vitest'
import { currentConversation } from '../../layers/nuxi/agent/lib/memory'

const slack = (channelId: string, extra: Record<string, string> = {}) => ({
  issuer: 'slack:T1',
  principalId: 'slack:T1:U1',
  principalType: 'user',
  attributes: { user_id: 'U1', channel_id: channelId, author_type: 'user', ...extra }
})

describe('currentConversation', () => {
  it('gives signed-in web users private memory, keyed on their account', () => {
    expect(currentConversation({ issuer: 'nuxt.com', principalId: 'acc1', principalType: 'user' }))
      .toEqual({ kind: 'private', owner: ['web', 'acc1'] })
  })

  it('gives anonymous web visitors no memory', () => {
    expect(currentConversation({ issuer: 'nuxt.com', principalId: 'cookie-id', principalType: 'anonymous' })).toBeNull()
  })

  it('keeps Slack DMs private and per person', () => {
    expect(currentConversation(slack('D123'))).toEqual({ kind: 'private', owner: ['slack', 'T1:U1'] })
  })

  it('shares one document per Slack channel, never the person\'s own', () => {
    expect(currentConversation(slack('C123'))).toEqual({ kind: 'slack-channel', teamId: 'T1', channelId: 'C123' })
    // Group DMs and private channels are shared too: other people read the thread.
    expect(currentConversation(slack('G123'))?.kind).toBe('slack-channel')
  })

  it('gives bots, Discord and schedules no memory', () => {
    expect(currentConversation(slack('C123', { author_type: 'bot' }))).toBeNull()
    expect(currentConversation({ issuer: 'discord', principalId: 'd1', attributes: { channel_id: 'x' } })).toBeNull()
    expect(currentConversation({ principalId: 'eve:app', principalType: 'runtime' })).toBeNull()
    expect(currentConversation(null)).toBeNull()
  })
})
