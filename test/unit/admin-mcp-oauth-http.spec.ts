import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as h3 from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMcpHandler, defineMcpTool } from '@nuxtjs/mcp-toolkit/server'
import { createAdminMcpOAuth, oauthSecret } from '../../server/lib/admin-mcp-oauth'
import * as oauthUtils from '../../server/utils/admin-mcp-oauth'
import * as schema from '../../server/db/schema'
import { users } from '../../server/db/schema'
import { requireInternalRequest } from '../../layers/nuxi/server/utils/internal-api'

const origin = 'https://nuxt.com'
const migrations = new URL('../../server/db/migrations/sqlite/', import.meta.url)
const journal: { entries: { tag: string }[] } = JSON.parse(readFileSync(new URL('meta/_journal.json', migrations), 'utf8'))
let client: ReturnType<typeof createClient>
let request: ReturnType<typeof h3.toWebHandler>
let oauth: ReturnType<typeof createAdminMcpOAuth>
let signedIn: boolean
const member = vi.fn(async () => true)
const user = { id: 'team', username: 'team' }
const pending = new Map<string, unknown>()

beforeEach(async () => {
  client = createClient({ url: ':memory:' })
  const database = drizzle(client)
  await client.execute('PRAGMA foreign_keys = ON')
  for (const { tag } of journal.entries) await client.executeMultiple(readFileSync(new URL(`${tag}.sql`, migrations), 'utf8').replaceAll('--> statement-breakpoint', ''))
  await database.insert(users).values({ ...user, name: 'Team member', avatar: '', provider: 'github', providerId: '42' })
  member.mockReset().mockResolvedValue(true)
  oauth = createAdminMcpOAuth(database, origin, member)
  signedIn = true
  pending.clear()
  for (const [name, value] of Object.entries(h3)) vi.stubGlobal(name, value)
  for (const [name, value] of Object.entries(oauthUtils)) vi.stubGlobal(name, value)
  vi.stubGlobal('FEEDBACK_RATINGS', ['very-helpful', 'helpful', 'not-helpful', 'confusing'])
  vi.stubGlobal('defineMcpTool', defineMcpTool)
  vi.stubGlobal('requireInternalRequest', requireInternalRequest)
  vi.stubGlobal('db', database)
  vi.stubGlobal('schema', schema)
  vi.stubGlobal('adminMcpOAuth', () => oauth)
  vi.stubGlobal('useRuntimeConfig', () => ({ mcpOauthIssuer: origin }))
  vi.stubGlobal('getUserSession', async () => ({ user: signedIn ? user : undefined }))
  vi.stubGlobal('requireUserSession', async () => {
    if (!signedIn) throw h3.createError({ statusCode: 401 })
    return { user }
  })
  vi.stubGlobal('kv', {
    get: async (key: string) => pending.get(key),
    set: async (key: string, value: unknown) => { pending.set(key, value) },
    del: async (key: string) => { pending.delete(key) }
  })
  const app = h3.createApp({ onError: () => {} })
  const router = h3.createRouter()
  const routes = [
    ['/api/internal/admin-mcp', 'post', await import('../../server/api/internal/admin-mcp')],
    ['/api/mcp/oauth/register', 'post', await import('../../server/api/mcp/oauth/register.post')],
    ['/api/admin/mcp-install', 'get', await import('../../server/api/admin/mcp-install.get')],
    ['/api/mcp/oauth/authorize', 'get', await import('../../server/api/mcp/oauth/authorize.get')],
    ['/api/mcp/oauth/consent', 'get', await import('../../server/api/mcp/oauth/consent.get')],
    ['/api/mcp/oauth/consent', 'post', await import('../../server/api/mcp/oauth/consent.post')],
    ['/api/mcp/oauth/token', 'post', await import('../../server/api/mcp/oauth/token.post')],
    ['/api/mcp/oauth/revoke', 'post', await import('../../server/api/mcp/oauth/revoke.post')],
    ['/.well-known/oauth-authorization-server', 'get', await import('../../server/routes/.well-known/oauth-authorization-server.get')],
    ['/.well-known/oauth-protected-resource/mcp/admin', 'get', await import('../../server/routes/.well-known/oauth-protected-resource/mcp/admin.get')]
  ] as const
  for (const [path, method, route] of routes) router[method](path, route.default)
  app.use((await import('../../server/middleware/mcp-oauth')).default)
  app.use(router)
  request = h3.toWebHandler(app)
})
afterEach(() => {
  client.close()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function start() {
  const registered = await oauth.register({ client_name: 'Test IDE', redirect_uris: ['http://127.0.0.1:4000/callback'] }, 'test')
  const verifier = oauthSecret()
  const params = new URLSearchParams({
    response_type: 'code', client_id: registered.client_id, redirect_uri: 'http://127.0.0.1:4000/callback',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    resource: `${origin}/mcp/admin`, state: 'client-state'
  })
  const response = await request(new Request(`${origin}/api/mcp/oauth/authorize?${params}`))
  const cookie = response.headers.get('set-cookie')!.split(';')[0]!
  const location = new URL(response.headers.get('location')!, origin)
  const id = location.searchParams.get('request') || new URL(location.searchParams.get('redirect')!, origin).searchParams.get('request')!
  return { registered, verifier, id, cookie }
}

const consentRequest = (id: string, cookie: string, requestOrigin = origin) => new Request(`${origin}/api/mcp/oauth/consent`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'origin': requestOrigin, cookie },
  body: JSON.stringify({ request: id, allow: true })
})

describe('admin MCP OAuth HTTP flow', () => {
  it('publishes discovery and completes approval, PKCE, an authenticated MCP tool call, refresh and revocation', async () => {
    const discovery = await request(new Request(`${origin}/.well-known/oauth-authorization-server`))
    expect(discovery.headers.get('access-control-allow-origin')).toBe('*')
    expect(await discovery.json()).toMatchObject({ issuer: origin, code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'] })
    const metadata = await request(new Request(`${origin}/.well-known/oauth-protected-resource/mcp/admin`))
    expect(await metadata.json()).toMatchObject({ resource: `${origin}/mcp/admin`, authorization_servers: [origin] })
    const { id, cookie, registered, verifier } = await start()
    const consent = await request(new Request(`${origin}/api/mcp/oauth/consent?request=${id}`, { headers: { cookie } }))
    expect(await consent.json()).toEqual({ client: { name: 'Test IDE', redirectUri: 'http://127.0.0.1:4000/callback' }, username: 'team' })
    const approved = await request(consentRequest(id, cookie))
    const result: { redirect: string } = await approved.json()
    const code = new URL(result.redirect).searchParams.get('code')!
    const exchange = await request(new Request(`${origin}/api/mcp/oauth/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', client_id: registered.client_id, redirect_uri: 'http://127.0.0.1:4000/callback', code, code_verifier: verifier, resource: `${origin}/mcp/admin` })
    }))
    expect(exchange.status).toBe(200)
    expect(exchange.headers.get('cache-control')).toBe('no-store')
    const tokens: { access_token: string, refresh_token: string } = await exchange.json()
    const handler = createMcpHandler({
      name: 'test-admin',
      auth: { schemes: ['bearer'], resourceMetadataUrl: oauth.urls.metadata, validate: async ({ token }) => Boolean(await oauth.verify(token)) },
      tools: [defineMcpTool({ name: 'identity', handler: () => 'Sanitized team-only result' })]
    })
    const call = (token: string) => handler.fetch(new Request(`${origin}/mcp/admin`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'accept': 'application/json, text/event-stream', 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/call', 'mcp-name': 'identity', 'authorization': `Bearer ${token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'identity', _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } })
    }))
    const legacy = await handler.fetch(new Request(`${origin}/mcp/admin`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'accept': 'application/json, text/event-stream', 'authorization': `Bearer ${tokens.access_token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'legacy-fixture', version: '1' } } })
    }))
    expect(legacy.status).toBe(200)
    expect(await legacy.text()).toContain('test-admin')
    const called = await call(tokens.access_token)
    expect(called.status, await called.clone().text()).toBe(200)
    expect(await called.text()).toContain('Sanitized team-only result')
    const refresh = await request(new Request(`${origin}/api/mcp/oauth/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: registered.client_id, refresh_token: tokens.refresh_token, resource: `${origin}/mcp/admin` })
    }))
    expect(refresh.status).toBe(200)
    const renewed: { access_token: string } = await refresh.json()
    const revoked = await request(new Request(`${origin}/api/mcp/oauth/revoke`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: renewed.access_token, client_id: registered.client_id })
    }))
    expect(revoked.status).toBe(200)
    const refused = await call(renewed.access_token)
    expect(refused.status).toBe(401)
    expect(refused.headers.get('www-authenticate')).toContain(`resource_metadata="${oauth.urls.metadata}"`)
  })

  it('keeps service calls on the internal credential and refuses it as public OAuth', async () => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {
      _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} }
    } })
    const serviceCall = (token: string) => request(new Request(`${origin}/api/internal/admin-mcp`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'mcp-method': 'tools/list', 'mcp-protocol-version': '2026-07-28', 'authorization': `Bearer ${token}` }, body
    }))
    vi.stubEnv('INTERNAL_API_SECRET', 'demo-service-secret')
    expect((await serviceCall('old-shared-token')).status).toBe(401)
    const response = await serviceCall('demo-service-secret')
    const text = await response.text()
    expect(response.status, text).toBe(200)
    expect(text).toContain('feedback-stats')
    expect(text).not.toContain('search-console-analytics')
    expect(await oauth.verify('demo-service-secret')).toBe(false)
    vi.stubEnv('INTERNAL_API_SECRET', '')
    expect((await serviceCall('demo-service-secret')).status).toBe(503)
  })

  it('registers clients over HTTP with a bounded registration rate and exports URL-only install config', async () => {
    for (let i = 0; i < 20; i++) {
      const response = await request(new Request(`${origin}/api/mcp/oauth/register`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_name: 'Example IDE', redirect_uris: ['http://127.0.0.1:4000/callback'] })
      }))
      expect(response.status).toBe(201)
      expect(await response.json()).toMatchObject({ token_endpoint_auth_method: 'none' })
    }
    const limited = await request(new Request(`${origin}/api/mcp/oauth/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
    }))
    expect(limited.status).toBe(429)
    const installed = await request(new Request(`${origin}/api/admin/mcp-install`))
    const config = await installed.json()
    expect(config).toMatchObject({ url: `${origin}/mcp/admin`, json: { type: 'http', url: `${origin}/mcp/admin` } })
    expect(JSON.stringify(config)).not.toMatch(/Bearer|Authorization|token/)
  })

  it('resolves the stable GitHub account ID and checks current core-team membership', async () => {
    const { id, cookie, registered, verifier } = await start()
    const approved = await request(consentRequest(id, cookie))
    const result: { redirect: string } = await approved.json()
    const tokens = await oauth.token({
      grant_type: 'authorization_code', client_id: registered.client_id,
      code: new URL(result.redirect).searchParams.get('code')!, code_verifier: verifier,
      redirect_uri: 'http://127.0.0.1:4000/callback', resource: `${origin}/mcp/admin`
    }, { 'content-type': 'application/x-www-form-urlencoded' })
    const github = vi.fn(async () => ({ login: 'RenamedTeamMember' }))
    const core = vi.fn(async () => true)
    vi.stubGlobal('$fetch', github)
    vi.stubGlobal('githubHeaders', () => ({}))
    vi.stubGlobal('isCoreTeamMember', core)
    const app = h3.createApp()
    app.use(h3.defineEventHandler(async (event) => {
      const verified = await oauthUtils.adminMcpOAuth(event).verify(tokens.access_token)
      return { authorized: Boolean(verified) }
    }))
    const check = h3.toWebHandler(app)
    expect(await (await check(new Request(origin))).json()).toEqual({ authorized: true })
    expect(github).toHaveBeenCalledWith('https://api.github.com/user/42', { headers: {} })
    expect(core).toHaveBeenCalledWith(expect.anything(), 'renamedteammember')
    core.mockResolvedValue(false)
    expect(await (await check(new Request(origin))).json()).toEqual({ authorized: false })
  })

  it('routes signed-out users through the existing GitHub login', async () => {
    signedIn = false
    const { id } = await start()
    expect(id).toBeTruthy()
    const consent = await request(new Request(`${origin}/api/mcp/oauth/consent?request=${id}`))
    expect(consent.status).toBe(401)
  })

  it('requires both a browser-bound request and the same-origin approval POST', async () => {
    const { id, cookie } = await start()
    for (const [cookies, requestOrigin] of [['', origin], [cookie, 'https://evil.example']]) {
      const response = await request(consentRequest(id, cookies!, requestOrigin))
      expect(response.status).toBe(requestOrigin === origin ? 400 : 403)
    }
    expect((await request(consentRequest(id, cookie))).status).toBe(200)
    expect((await request(consentRequest(id, cookie))).status).toBe(400)
  })

  it('refuses non-members and expired browser requests', async () => {
    const { id, cookie } = await start()
    member.mockResolvedValue(false)
    const refused = await request(new Request(`${origin}/api/mcp/oauth/consent?request=${id}`, { headers: { cookie } }))
    expect(refused.status).toBe(403)
    member.mockResolvedValue(true)
    const value = pending.get(`mcp:consent:${id}`)
    if (!value || typeof value !== 'object') throw new Error('Missing fixture')
    pending.set(`mcp:consent:${id}`, { ...value, expiresAt: 0 })
    expect((await request(consentRequest(id, cookie))).status).toBe(400)
  })

  it('rejects duplicate token parameters, JSON token bodies and oversized payloads', async () => {
    for (const [contentType, body] of [
      ['application/x-www-form-urlencoded', 'client_id=a&client_id=b'],
      ['application/json', '{}'],
      ['application/x-www-form-urlencoded', `token=${'a'.repeat(8192)}`]
    ]) {
      const response = await request(new Request(`${origin}/api/mcp/oauth/token`, { method: 'POST', headers: { 'content-type': contentType! }, body }))
      expect(response.status).toBe(400)
      expect(await response.json()).toHaveProperty('error', 'invalid_request')
    }
  })
})
