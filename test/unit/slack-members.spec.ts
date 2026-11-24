import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { slackApi } from '../../layers/nuxi/agent/lib/slack/api'
import { findFullSlackMember, resetSlackMemberCache } from '../../layers/nuxi/agent/lib/slack/members'

vi.mock('../../layers/nuxi/agent/lib/slack/api', () => ({ slackApi: vi.fn() }))

const mockedSlackApi = vi.mocked(slackApi)

function usersInfo(user: Record<string, unknown>) {
  mockedSlackApi.mockResolvedValue({ ok: true, user: { team_id: 'T_HOME', profile: { display_name: 'Ada' }, ...user } })
}

beforeEach(() => {
  resetSlackMemberCache()
  mockedSlackApi.mockReset()
  vi.stubEnv('SLACK_TEAM_ID', 'T_HOME')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('findFullSlackMember', () => {
  it('admits an active member of the home workspace with their name', async () => {
    usersInfo({})
    expect(await findFullSlackMember('U1')).toEqual({ name: 'Ada', fullMember: true })
  })

  it.each([
    ['a multi-channel guest', { is_restricted: true }],
    ['a single-channel guest', { is_ultra_restricted: true }],
    ['a deactivated account', { deleted: true }],
    ['a Slack Connect user from another workspace', { team_id: 'T_OTHER' }]
  ])('rejects %s', async (_label, user) => {
    usersInfo(user)
    expect(await findFullSlackMember('U1')).toBeNull()
  })

  it('accepts any workspace when SLACK_TEAM_ID is unset', async () => {
    vi.stubEnv('SLACK_TEAM_ID', '')
    usersInfo({ team_id: 'T_OTHER' })
    expect(await findFullSlackMember('U1')).not.toBeNull()
  })

  it('fails closed when Slack errors, and asks again next time', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockedSlackApi.mockResolvedValueOnce({ ok: false, error: 'ratelimited' })
    expect(await findFullSlackMember('U1')).toBeNull()

    usersInfo({})
    expect(await findFullSlackMember('U1')).not.toBeNull()
    expect(mockedSlackApi).toHaveBeenCalledTimes(2)
    error.mockRestore()
  })

  it('rejects an unknown user and a missing id', async () => {
    mockedSlackApi.mockResolvedValue({ ok: false, error: 'user_not_found' })
    expect(await findFullSlackMember('U1')).toBeNull()
    expect(await findFullSlackMember(undefined)).toBeNull()
  })
})
