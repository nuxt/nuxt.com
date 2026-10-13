import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canReadSlackChannel } from '../../layers/nuxi/agent/lib/slack/access'
import { isSlackChannelMember } from '../../layers/nuxi/agent/lib/slack/api'

vi.mock('../../layers/nuxi/agent/lib/slack/api', () => ({
  digestSlackChannelRef: vi.fn(async () => 'C_DIGEST'),
  firehoseSlackChannelRef: vi.fn(async () => 'C_FIREHOSE'),
  resolveSlackChannelRef: vi.fn(async (ref: string) => ({ id: ref, name: ref, ref })),
  isSlackChannelMember: vi.fn()
}))

const mockedIsMember = vi.mocked(isSlackChannelMember)

const scheduleAuth = { principalId: 'eve:app', principalType: 'runtime' }
const slackUser = { issuer: 'slack:T1', principalId: 'slack:T1:U1', attributes: { user_id: 'U1', author_type: 'user' } }
const slackBot = { issuer: 'slack:T1', principalId: 'slack:T1:bot:B1', attributes: { user_id: 'B1', author_type: 'bot' } }
const webAdmin = { issuer: 'nuxt.com', principalId: 'gh:1', attributes: { role: 'admin' } }

beforeEach(() => {
  mockedIsMember.mockReset()
})

describe('canReadSlackChannel', () => {
  it('lets scheduled runs read any channel', async () => {
    expect(await canReadSlackChannel(scheduleAuth, 'C_OTHER')).toBe(true)
    expect(mockedIsMember).not.toHaveBeenCalled()
  })

  it('opens the configured channels to every caller that reaches the tool', async () => {
    expect(await canReadSlackChannel(webAdmin, 'C_FIREHOSE')).toBe(true)
    expect(await canReadSlackChannel(slackUser, 'C_DIGEST')).toBe(true)
  })

  it('requires Slack users to be members of other channels', async () => {
    mockedIsMember.mockResolvedValueOnce(true)
    expect(await canReadSlackChannel(slackUser, 'C_OTHER')).toBe(true)
    expect(mockedIsMember).toHaveBeenCalledWith('C_OTHER', 'U1')

    mockedIsMember.mockResolvedValueOnce(false)
    expect(await canReadSlackChannel(slackUser, 'C_OTHER')).toBe(false)
  })

  it('denies other channels to bots and non-Slack callers', async () => {
    expect(await canReadSlackChannel(slackBot, 'C_OTHER')).toBe(false)
    expect(await canReadSlackChannel(webAdmin, 'C_OTHER')).toBe(false)
    expect(await canReadSlackChannel(null, 'C_OTHER')).toBe(false)
    expect(mockedIsMember).not.toHaveBeenCalled()
  })
})
