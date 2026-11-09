import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('eve/tools', () => ({ defineDynamic: (value: unknown) => value, defineTool: (value: unknown) => value }))
vi.mock('eve/connections', () => ({ defineMcpClientConnection: (value: unknown) => value }))
vi.mock('../../layers/nuxi/agent/lib/internal-api', () => ({ internalFetch: vi.fn(), appOrigin: () => 'https://nuxt.com' }))

const { internalFetch } = await import('../../layers/nuxi/agent/lib/internal-api')
const discovery = (await import('../../layers/nuxi/agent/tools/discover_showcase_candidates')).default as any
const preview = (await import('../../layers/nuxi/agent/tools/app-preview')).default as any
const connection = (await import('../../layers/nuxi/agent/connections/admin-mcp')).default as any
const admin = { principalId: 'eve:app', principalType: 'runtime' }
const publicAuth = { principalId: 'anon', principalType: 'anonymous', issuer: 'nuxt.com' }
const context = (auth: unknown) => ({ session: { auth: { current: auth } }, memo: (_key: unknown, fn: () => unknown) => fn() })

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('Nuxi internal preview requests', () => {
  it('sends both deployment identity and internal API credentials', async () => {
    const { internalFetch: request } = await vi.importActual<typeof import('../../layers/nuxi/agent/lib/internal-api')>('../../layers/nuxi/agent/lib/internal-api')
    const token = `test.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret')
    vi.stubEnv('VERCEL_OIDC_TOKEN', token)
    vi.stubEnv('VERCEL_OIDC_TOKEN_FILE', undefined)
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ files: ['app.vue'] })))

    await expect(request('/api/internal/templates/preview', { method: 'POST', body: JSON.stringify({ action: 'list', sandboxId: 'preview', principalId: 'visitor' }) }))
      .resolves.toEqual({ files: ['app.vue'] })
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({
      'Authorization': 'Bearer test-internal-secret',
      'x-vercel-trusted-oidc-idp-token': token
    }) }))
  })

  it('keeps local requests working without a deployment protection secret', async () => {
    const { internalHeaders } = await vi.importActual<typeof import('../../layers/nuxi/agent/lib/internal-api')>('../../layers/nuxi/agent/lib/internal-api')
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret')
    vi.stubEnv('VERCEL', undefined)
    vi.stubEnv('VERCEL_OIDC_TOKEN', undefined)
    vi.stubEnv('VERCEL_OIDC_TOKEN_FILE', undefined)
    expect(await internalHeaders({ cookie: 'session=test' })).toEqual({
      'Authorization': 'Bearer test-internal-secret',
      'content-type': 'application/json',
      'cookie': 'session=test'
    })
  })

  it('preserves app authentication when a Vercel identity is unavailable', async () => {
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret')
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('VERCEL_OIDC_TOKEN', undefined)
    vi.stubEnv('VERCEL_OIDC_TOKEN_FILE', new URL('./missing-oidc-token', import.meta.url).pathname)
    const { internalHeaders } = await vi.importActual<typeof import('../../layers/nuxi/agent/lib/internal-api')>('../../layers/nuxi/agent/lib/internal-api')
    await expect(internalHeaders()).resolves.toEqual({
      'Authorization': 'Bearer test-internal-secret',
      'content-type': 'application/json'
    })
  })
})

describe('Nuxi discovery and SEO access', () => {
  it('hides discovery from public sessions and rechecks the caller before reading any content', async () => {
    expect(await discovery(context(publicAuth))).toBeNull()
    const tools = await discovery(context(admin))
    await expect(tools.discover_showcase_candidates.execute({ sinceDays: 7, limit: 20 }, context(publicAuth))).rejects.toThrow('admin mode')
    expect(internalFetch).not.toHaveBeenCalled()
  })

  it('preserves Google and template tools but refuses public calls before returning a token', async () => {
    expect(connection.tools.allow).toEqual(expect.arrayContaining([
      'search-console-analytics', 'search-console-inspect-url', 'search-console-sitemaps', 'crux-web-vitals',
      'start-template-checks', 'template-check-status'
    ]))
    const denied = await connection.auth(context(publicAuth))
    await expect(denied.getToken()).rejects.toThrow('not available')
    vi.stubEnv('NUXT_MCP_ADMIN_TOKEN', 'test-admin-token')
    const allowed = await connection.auth(context(admin))
    await expect(allowed.getToken()).resolves.toEqual({ token: 'test-admin-token' })
  })
})

describe('Nuxi live preview access', () => {
  it('offers editing tools only to browser sessions', () => {
    for (const auth of [undefined, { issuer: 'slack' }, { issuer: 'discord' }, { issuer: 'nuxt.com' }, { issuer: 'nuxt.com', principalId: '' }, { principalId: 'eve:app', principalType: 'runtime' }]) {
      expect(preview(context(auth))).toBeNull()
    }
    expect(preview(context(publicAuth))?.edit_app_file).toBeDefined()
  })

  it('rechecks the caller when executing a previously offered tool', () => {
    const tools = preview(context(publicAuth))
    for (const tool of Object.values(tools) as any[]) {
      expect(() => tool.execute({ sandboxId: 'preview' }, context({ issuer: 'slack' }))).toThrow('browser session')
      expect(() => tool.execute({ sandboxId: 'preview' }, context({ issuer: 'nuxt.com' }))).toThrow('browser session')
    }
    expect(internalFetch).not.toHaveBeenCalled()
  })

  it('takes ownership and the action from the executing session and tool, never model arguments', async () => {
    const tools = preview(context(publicAuth))
    const caller = { ...publicAuth, principalId: 'current-visitor' }
    const actions = { list_app_files: 'list', read_app_file: 'read', edit_app_file: 'edit', add_app_module: 'add_module', check_app_page: 'check' }
    for (const [name, action] of Object.entries(actions)) {
      await tools[name].execute({ sandboxId: 'preview', principalId: 'model-supplied', action: 'model-supplied' }, context(caller))
      const [path, request] = vi.mocked(internalFetch).mock.lastCall!
      expect(path).toBe('/api/internal/templates/preview')
      expect(JSON.parse(request!.body as string)).toEqual({ action, principalId: caller.principalId, sandboxId: 'preview' })
    }
  })

  it('allows the edit request budget to cover startup followed by a config restart', async () => {
    vi.useFakeTimers()
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(new Error('Request timed out')), ms)
      return controller.signal
    })
    try {
      vi.mocked(internalFetch).mockImplementationOnce((_path, request) => new Promise((resolve, reject) => {
        request!.signal!.addEventListener('abort', () => reject(request!.signal!.reason), { once: true })
        // The API allows 130s for startup, then 150s for the config restart.
        setTimeout(() => resolve({ path: 'nuxt.config.ts', restarted: true }), 280_000)
      }))
      const result = preview(context(publicAuth)).edit_app_file.execute({ sandboxId: 'preview', path: 'nuxt.config.ts', content: 'export default {}' }, context(publicAuth))
        .then((value: unknown) => ({ value }), (error: unknown) => ({ error }))
      await vi.advanceTimersByTimeAsync(280_000)
      expect(await result).toEqual({ value: { path: 'nuxt.config.ts', restarted: true } })
      expect(internalFetch).toHaveBeenCalledOnce()
    } finally {
      timeout.mockRestore()
      vi.useRealTimers()
    }
  })
})
