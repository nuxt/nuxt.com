import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import { readGlobalConfig } from '../../layers/nuxi/agent/lib/global-config'
import { requireAdminUserSession } from '../../server/utils/team'

vi.mock('../../layers/nuxi/agent/lib/global-config', () => ({ readGlobalConfig: vi.fn() }))

describe('requireAdminUserSession', () => {
  const event = {} as any
  let session: ReturnType<typeof vi.fn>
  let fetch: ReturnType<typeof vi.fn>

  const coreTeam = (...logins: string[]) => ({
    data: { organization: { team: { members: { nodes: logins.map(login => ({ login })) } } } }
  })

  beforeEach(() => {
    session = vi.fn().mockResolvedValue({ user: { role: 'admin', username: 'HugoRCD' } })
    fetch = vi.fn().mockResolvedValue(coreTeam('hugorcd'))
    vi.mocked(readGlobalConfig).mockResolvedValue({})
    vi.stubGlobal('requireUserSession', session)
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('useRuntimeConfig', () => ({ github: { token: 'token' } }))
    vi.stubGlobal('githubHeaders', () => ({}))
    vi.stubGlobal('$fetch', fetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns the session of a current core team admin', async () => {
    await expect(requireAdminUserSession(event)).resolves.toEqual({ user: { role: 'admin', username: 'HugoRCD' } })
  })

  it('passes through the 401 when signed out', async () => {
    session.mockRejectedValueOnce(createError({ statusCode: 401 }))
    await expect(requireAdminUserSession(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a signed-in user whose session role is not admin, without asking GitHub', async () => {
    session.mockResolvedValueOnce({ user: { role: 'user', username: 'HugoRCD' } })
    await expect(requireAdminUserSession(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects an admin session whose login has left the core team', async () => {
    // GitHub's member search is a prefix match, so a similar login must not count.
    fetch.mockResolvedValueOnce(coreTeam('hugorcd-bot'))
    await expect(requireAdminUserSession(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('accepts an allowlisted login from Global Config without asking GitHub', async () => {
    vi.mocked(readGlobalConfig).mockResolvedValueOnce({ admin: { githubLogins: ['HugoRCD'] } })
    await expect(requireAdminUserSession(event)).resolves.toMatchObject({ user: { username: 'HugoRCD' } })
    expect(fetch).not.toHaveBeenCalled()
  })
})
