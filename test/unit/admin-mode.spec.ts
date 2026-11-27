import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isAdminMode } from '../../layers/nuxi/agent/lib/identity/admin-mode'
import { allowedRepository, githubToolsApproval, repositoryInput } from '../../layers/nuxi/agent/lib/github'

vi.mock('@vercel/connect', () => ({ getToken: vi.fn(async () => 'app-token') }))

vi.mock('@vercel/global-config', () => ({
  getAll: vi.fn(async () => ({ discord: { channels: { admin: ['C_ADMIN'], public: ['C_PUBLIC'] } } }))
}))

const localDevAuth = {
  authenticator: 'local-dev',
  principalId: 'local-dev',
  principalType: 'local-dev',
  attributes: {}
} as const

describe('isAdminMode', () => {
  beforeEach(() => {
    vi.stubEnv('GLOBAL_CONFIG', 'https://edge-config.vercel.com/ecfg_test?token=test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

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

  it('grants the local CLI when NUXI_CLI_ADMIN=1 outside production', async () => {
    vi.stubEnv('NUXI_CLI_ADMIN', '1')
    vi.stubEnv('VERCEL_ENV', '')
    expect(await isAdminMode(localDevAuth)).toBe(true)
  })

  it('denies the local CLI without NUXI_CLI_ADMIN', async () => {
    vi.stubEnv('NUXI_CLI_ADMIN', '')
    vi.stubEnv('VERCEL_ENV', '')
    expect(await isAdminMode(localDevAuth)).toBe(false)
  })

  it('denies the local CLI on Vercel production even with NUXI_CLI_ADMIN=1', async () => {
    vi.stubEnv('NUXI_CLI_ADMIN', '1')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(await isAdminMode(localDevAuth)).toBe(false)
  })
})

describe('the repositories the coder may write to', () => {
  const allowed = ['nuxt/nuxt.com', 'nuxt-modules/*']

  it('allows a listed repository and every repository of a listed account, whatever the case', () => {
    expect(allowedRepository('nuxt/nuxt.com', allowed)).toBe('nuxt/nuxt.com')
    expect(allowedRepository('Nuxt/Nuxt.com', allowed)).toBe('nuxt/nuxt.com')
    expect(allowedRepository('nuxt-modules/i18n', allowed)).toBe('nuxt-modules/i18n')
    expect(allowedRepository('Nuxt-Modules/.github', allowed)).toBe('nuxt-modules/.github')
  })

  it.each([
    ['another repository of an account listed for one', 'nuxt/ui'],
    ['an account that only starts like a listed one', 'nuxt-modules-evil/i18n'],
    ['a listed account as a repository name', 'evil/nuxt-modules'],
    ['the pattern itself', 'nuxt-modules/*'],
    ['a third segment', 'nuxt-modules/i18n/extra'],
    ['a name that climbs', 'nuxt-modules/..'],
    ['a name with a query', 'nuxt-modules/i18n?x=1'],
    ['no name', 'nuxt-modules/'],
    ['no owner', 'nuxt.com'],
    ['something that is not text', null]
  ])('refuses %s', (_, repository) => {
    expect(allowedRepository(repository, allowed)).toBeUndefined()
  })

  it('gives a tool the default repository, and refuses one outside the list before the tool runs', () => {
    const input = repositoryInput('Repository to commit to')

    expect(input.parse(undefined)).toBe('nuxt/nuxt.com')
    expect(input.parse('Nuxt/nuxt.com')).toBe('Nuxt/nuxt.com')
    expect(() => input.parse('nuxt/ui')).toThrow('Not a repository Nuxi works on: nuxt/nuxt.com.')
  })
})

describe('githubToolsApproval', () => {
  beforeEach(() => {
    vi.stubEnv('GLOBAL_CONFIG', 'https://edge-config.vercel.com/ecfg_test?token=test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const slackUser = { issuer: 'slack:T123', principalId: 'slack:T123:U1', principalType: 'user', attributes: { user_id: 'U1', author_type: 'user' } }
  const denied = { type: 'denied', reason: 'GitHub tools are only available to the Nuxt team on Slack and in admin Discord channels.' }

  function decide(toolName: string, auth: Record<string, unknown> | null, toolInput?: Record<string, unknown>) {
    return githubToolsApproval({ toolName, toolInput, session: { auth: { current: auth } } } as unknown as Parameters<typeof githubToolsApproval>[0])
  }

  /** GitHub with one open pull request, from `nuxi/showcase-world-triathlon`. Returns the `head` of every lookup. */
  function githubWithOnePullRequest() {
    const heads: Array<string | null> = []
    vi.stubGlobal('fetch', async (input: string | URL) => {
      const url = new URL(String(input))
      const head = url.searchParams.get('head')
      heads.push(head)
      return Response.json(url.pathname === '/repos/nuxt/nuxt.com/pulls' && head === 'nuxt:nuxi/showcase-world-triathlon' ? [{ number: 2679 }] : [])
    })
    return heads
  }

  it('asks before a commit to a branch that has an open pull request', async () => {
    githubWithOnePullRequest()

    expect(await decide('github__editFiles', slackUser, { branch: 'nuxi/showcase-world-triathlon', message: 'feat(showcase): add World Triathlon' })).toBe('user-approval')
    expect(await decide('commit_assets', slackUser, { repository: 'nuxt/nuxt.com', branch: 'nuxi/showcase-world-triathlon' })).toBe('user-approval')
  })

  it('lets a commit to a branch without a pull request through, and looks up nothing for other tools', async () => {
    const heads = githubWithOnePullRequest()

    expect(await decide('github__editFiles', slackUser, { owner: 'nuxt', repo: 'nuxt.com', branch: 'nuxi/showcase-world-triathlon-assets' })).toBeUndefined()
    expect(await decide('commit_assets', slackUser, { branch: 'nuxi/showcase-world-triathlon-assets' })).toBeUndefined()
    expect(await decide('github__createBranch', slackUser, { branch: 'nuxi/showcase-world-triathlon' })).toBeUndefined()
    expect(await decide('capture_screenshot', slackUser, { name: 'world-triathlon' })).toBeUndefined()
    expect(heads).toEqual(['nuxt:nuxi/showcase-world-triathlon-assets', 'nuxt:nuxi/showcase-world-triathlon-assets'])
  })

  it('asks whatever the case of the repository, which GitHub and the guardrails ignore', async () => {
    const heads = githubWithOnePullRequest()

    expect(await decide('github__editFiles', slackUser, { owner: 'Nuxt', repo: 'nuxt.com', branch: 'nuxi/showcase-world-triathlon' })).toBe('user-approval')
    expect(await decide('github__editFiles', slackUser, { repo: 'NUXT.COM', branch: 'nuxi/showcase-world-triathlon' })).toBe('user-approval')
    expect(await decide('commit_assets', slackUser, { repository: 'Nuxt/Nuxt.com', branch: 'nuxi/showcase-world-triathlon' })).toBe('user-approval')
    expect(heads).toEqual(Array(3).fill('nuxt:nuxi/showcase-world-triathlon'))
  })

  it('reads the repository where the tool does, so an input the tool ignores can\'t move the lookup', async () => {
    githubWithOnePullRequest()

    expect(await decide('github__editFiles', slackUser, { repository: 'nuxt/ui', branch: 'nuxi/showcase-world-triathlon' })).toBe('user-approval')
    expect(await decide('commit_assets', slackUser, { owner: 'nuxt', repo: 'ui', branch: 'nuxi/showcase-world-triathlon' })).toBe('user-approval')
  })

  it('denies a commit it can\'t place, instead of letting it through unasked', async () => {
    const heads = githubWithOnePullRequest()
    const unplaced = { type: 'denied', reason: 'A commit names a branch of one of these repositories: nuxt/nuxt.com.' }

    expect(await decide('github__editFiles', slackUser, { owner: 'nuxt', repo: 'ui', branch: 'nuxi/showcase-world-triathlon' })).toEqual(unplaced)
    expect(await decide('github__editFiles', slackUser, { owner: null, branch: 'nuxi/showcase-world-triathlon' })).toEqual(unplaced)
    expect(await decide('commit_assets', slackUser, { repository: 'nuxt/ui', branch: 'nuxi/showcase-world-triathlon' })).toEqual(unplaced)
    expect(await decide('github__editFiles', slackUser, { message: 'docs: fix typo' })).toEqual(unplaced)
    expect(await decide('commit_assets', slackUser)).toEqual(unplaced)
    expect(heads).toEqual([])
  })

  it('asks when GitHub can\'t say whether the branch has a pull request', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ message: 'Bad credentials' }, { status: 401 }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(await decide('github__editFiles', slackUser, { branch: 'nuxi/fix-typo' })).toBe('user-approval')
  })

  it('still denies a commit where GitHub tools are not offered', async () => {
    githubWithOnePullRequest()

    expect(await decide('github__editFiles', { issuer: 'discord', principalId: 'discord:U1', principalType: 'user', attributes: { channel_id: 'C_PUBLIC' } }, { branch: 'nuxi/showcase-world-triathlon' })).toEqual(denied)
  })

  it('leaves GitHub tools to their own policy for a human on Slack and in an admin Discord channel', async () => {
    expect(await decide('github__createPullRequest', slackUser)).toBeUndefined()
    expect(await decide('github__createPullRequest', { issuer: 'discord', principalId: 'discord:U1', principalType: 'user', attributes: { channel_id: 'C_ADMIN' } })).toBeUndefined()
  })

  it('denies GitHub tools in a public Discord channel', async () => {
    expect(await decide('github__getFileContent', { issuer: 'discord', principalId: 'discord:U1', principalType: 'user', attributes: { channel_id: 'C_PUBLIC' } })).toEqual(denied)
  })

  it('denies GitHub tools to web admins and schedules', async () => {
    expect(await decide('github__getFileContent', { principalId: 'eve:app', principalType: 'runtime' })).toEqual(denied)
    expect(await decide('github__getFileContent', { issuer: 'nuxt.com', principalId: 'u1', principalType: 'user', attributes: { role: 'admin' } })).toEqual(denied)
  })

  it('denies GitHub tools to a Slack bot and to anonymous web visitors', async () => {
    expect(await decide('github__editFiles', { ...slackUser, principalType: 'service', attributes: { user_id: 'B1', author_type: 'bot' } })).toEqual(denied)
    expect(await decide('github__editFiles', { issuer: 'nuxt.com', principalId: 'anon', principalType: 'anonymous' })).toEqual(denied)
  })

  it('leaves other tools alone in public sessions', async () => {
    expect(await decide('search_docs', { issuer: 'nuxt.com', principalId: 'anon', principalType: 'anonymous' })).toBeUndefined()
  })
})
