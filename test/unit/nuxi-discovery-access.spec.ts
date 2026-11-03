import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('eve/tools', () => ({ defineDynamic: (value: unknown) => value, defineTool: (value: unknown) => value }))
vi.mock('eve/connections', () => ({ defineMcpClientConnection: (value: unknown) => value }))
vi.mock('../../layers/nuxi/agent/lib/internal-api', () => ({ internalFetch: vi.fn(), appOrigin: () => 'https://nuxt.com' }))

const { internalFetch } = await import('../../layers/nuxi/agent/lib/internal-api')
const discovery = (await import('../../layers/nuxi/agent/tools/discover_showcase_candidates')).default as any
const connection = (await import('../../layers/nuxi/agent/connections/admin-mcp')).default as any
const admin = { principalId: 'eve:app', principalType: 'runtime' }
const publicAuth = { principalId: 'anon', principalType: 'anonymous', issuer: 'nuxt.com' }
const context = (auth: unknown) => ({ session: { auth: { current: auth } } })

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Nuxi discovery and SEO access', () => {
  it('hides discovery from public sessions and rechecks the caller before reading any content', async () => {
    expect(await discovery.events['session.started']({}, context(publicAuth))).toBeNull()
    const tools = await discovery.events['session.started']({}, context(admin))
    await expect(tools.discover_showcase_candidates.execute({ sinceDays: 7, limit: 20 }, context(publicAuth))).rejects.toThrow('admin mode')
    expect(internalFetch).not.toHaveBeenCalled()
  })

  it('exposes the read-only Google tools but refuses public calls before returning a token', async () => {
    expect(connection.tools.allow).toEqual(expect.arrayContaining([
      'search-console-analytics', 'search-console-inspect-url', 'search-console-sitemaps', 'crux-web-vitals'
    ]))
    const denied = await connection.auth(context(publicAuth))
    await expect(denied.getToken()).rejects.toThrow('not available')
    vi.stubEnv('NUXT_MCP_ADMIN_TOKEN', 'test-admin-token')
    const allowed = await connection.auth(context(admin))
    await expect(allowed.getToken()).resolves.toEqual({ token: 'test-admin-token' })
  })
})
