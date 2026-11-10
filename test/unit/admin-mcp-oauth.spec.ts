import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminMcpOAuth, mcpOAuthUrls, oauthHash, oauthSecret } from '../../server/lib/admin-mcp-oauth'
import { mcpOAuthGrants, mcpOAuthTokens, users } from '../../server/db/schema'

const issuer = 'https://nuxt.com'
const resource = `${issuer}/mcp/admin`
const redirect = 'http://127.0.0.1:4153/callback'
const headers = { 'content-type': 'application/x-www-form-urlencoded' }
const migrations = new URL('../../server/db/migrations/sqlite/', import.meta.url)
const journal: { entries: { tag: string }[] } = JSON.parse(readFileSync(new URL('meta/_journal.json', migrations), 'utf8'))
let client: ReturnType<typeof createClient>
let database: ReturnType<typeof drizzle>
const authorized = vi.fn(async () => true)
let oauth: ReturnType<typeof createAdminMcpOAuth>

beforeEach(async () => {
  client = createClient({ url: ':memory:' })
  database = drizzle(client)
  await client.execute('PRAGMA foreign_keys = ON')
  for (const { tag } of journal.entries) {
    await client.executeMultiple(readFileSync(new URL(`${tag}.sql`, migrations), 'utf8').replaceAll('--> statement-breakpoint', ''))
  }
  await database.insert(users).values({ id: 'team', name: 'Team member', avatar: '', username: 'team', provider: 'github', providerId: '42' })
  authorized.mockReset().mockResolvedValue(true)
  oauth = createAdminMcpOAuth(database, issuer, authorized)
})
afterEach(() => client.close())

async function connection() {
  const registered = await oauth.register({ client_name: 'Test IDE', redirect_uris: [redirect] }, 'test')
  const verifier = oauthSecret()
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const { request } = await oauth.validateAuthorization({
    response_type: 'code', client_id: registered.client_id, redirect_uri: redirect,
    resource, code_challenge: challenge, code_challenge_method: 'S256', state: 'client-state'
  })
  const location = new URL(await oauth.authorize(request, 'team', true))
  expect(location.searchParams.get('state')).toBe('client-state')
  const code = location.searchParams.get('code')!
  const exchange = {
    grant_type: 'authorization_code', code, code_verifier: verifier,
    client_id: registered.client_id, redirect_uri: redirect, resource
  }
  return { registered, verifier, request, code, exchange }
}

async function connected() {
  const result = await connection()
  const tokens = await oauth.token(result.exchange, headers)
  const refresh = { grant_type: 'refresh_token', refresh_token: tokens.refresh_token!, client_id: result.registered.client_id, resource }
  return { ...result, tokens, refresh }
}

describe('admin MCP OAuth', () => {
  it('registers a public client, obtains consent, exchanges PKCE and binds access to its user and resource', async () => {
    const { tokens, registered } = await connected()
    expect(tokens).toMatchObject({ token_type: 'Bearer', scope: 'nuxt:admin' })
    expect(tokens.expires_in).toBeGreaterThan(890)
    authorized.mockClear()
    expect(await oauth.verify(tokens.access_token)).toEqual({ sub: 'team', scope: 'nuxt:admin', client_id: registered.client_id })
    expect(authorized).not.toHaveBeenCalled()
    expect(await oauth.canAuthorize('team')).toEqual({ id: 'team' })
    expect(authorized).toHaveBeenCalledWith(expect.objectContaining({ id: 'team', providerId: '42' }))
    const otherResource = createAdminMcpOAuth(database, 'https://preview.nuxt.com', authorized)
    expect(await otherResource.verify(tokens.access_token)).toBe(false)
  })

  it('stores only hashes of authorization codes and tokens', async () => {
    const { code, tokens } = await connected()
    const [grant] = await database.select().from(mcpOAuthGrants)
    const [token] = await database.select().from(mcpOAuthTokens)
    expect(grant!.codeHash).toBe(oauthHash(code))
    expect(token!.accessHash).toBe(oauthHash(tokens.access_token))
    expect(token!.refreshHash).toBe(oauthHash(tokens.refresh_token!))
    const stored = JSON.stringify({ grant, token })
    for (const secret of [code, tokens.access_token, tokens.refresh_token!]) expect(stored).not.toContain(secret)
  })

  it('denies consent without issuing a code and rejects users outside the team', async () => {
    const { request } = await connection()
    const denied = new URL(await oauth.authorize(request, 'team', false))
    expect(denied.searchParams.get('error')).toBe('access_denied')
    expect(denied.searchParams.has('code')).toBe(false)
    expect(await database.select().from(mcpOAuthGrants)).toHaveLength(1)
    authorized.mockResolvedValue(false)
    await expect(oauth.authorize(request, 'team', true)).rejects.toMatchObject({ name: 'access_denied' })
  })

  it.each([
    { code_verifier: 'a'.repeat(43) },
    { redirect_uri: `${redirect}/different` },
    { resource: 'https://other.example/mcp' },
    { resource: '' },
    { client_id: 'unknown' }
  ])('rejects a mismatched exchange %j', async (change) => {
    const { exchange } = await connection()
    await expect(oauth.token({ ...exchange, ...change }, headers)).rejects.toThrow()
    expect(await database.select().from(mcpOAuthTokens)).toHaveLength(0)
  })

  it('rejects unregistered callbacks, missing PKCE and plain PKCE', async () => {
    const { request } = await connection()
    for (const change of [{ redirect_uri: 'https://evil.example/callback' }, { code_challenge: '' }, { code_challenge_method: 'plain' }, { scope: 'other' }]) {
      await expect(oauth.validateAuthorization({ ...request, ...change })).rejects.toThrow()
    }
  })

  it.each(['http://evil.example/callback', 'https://good.example/#fragment', 'https://user:password@good.example/callback', 'javascript:alert(1)'])('refuses unsafe callback %s', async (uri) => {
    await expect(oauth.register({ redirect_uris: [uri] }, 'test')).rejects.toThrow()
  })

  it('consumes an authorization code once and revokes its tokens on replay', async () => {
    const { exchange, tokens } = await connected()
    await expect(oauth.token(exchange, headers)).rejects.toThrow()
    expect(await oauth.verify(tokens.access_token)).toBe(false)
  })

  it('never issues two tokens for concurrent code exchanges', async () => {
    const { exchange } = await connection()
    const results = await Promise.allSettled([oauth.token(exchange, headers), oauth.token(exchange, headers)])
    expect(results.filter(result => result.status === 'fulfilled').length).toBeLessThanOrEqual(1)
    const [grant] = await database.select().from(mcpOAuthGrants)
    expect(grant!.revokedAt).toBeInstanceOf(Date)
  })

  it('rotates refresh tokens and revokes the whole grant on reuse', async () => {
    const { tokens, refresh } = await connected()
    const renewed = await oauth.token(refresh, headers)
    expect(renewed.refresh_token).not.toBe(tokens.refresh_token)
    expect(await oauth.verify(renewed.access_token)).toBeTruthy()
    await expect(oauth.token(refresh, headers)).rejects.toThrow()
    expect(await oauth.verify(tokens.access_token)).toBe(false)
    expect(await oauth.verify(renewed.access_token)).toBe(false)
    await expect(oauth.token({ ...refresh, refresh_token: renewed.refresh_token! }, headers)).rejects.toThrow()
  })

  it('rejects a refresh from another client without revoking the real connection', async () => {
    const { refresh, tokens } = await connected()
    const other = await oauth.register({ redirect_uris: [redirect] }, 'test')
    await expect(oauth.token({ ...refresh, client_id: other.client_id }, headers)).rejects.toThrow()
    expect(await oauth.verify(tokens.access_token)).toBeTruthy()
    expect(await oauth.token(refresh, headers)).toHaveProperty('access_token')
  })

  it('authenticates an existing token after membership loss while policy and refresh deny access', async () => {
    const { tokens, refresh, registered } = await connected()
    authorized.mockResolvedValue(false)
    authorized.mockClear()
    const identity = { sub: 'team', scope: 'nuxt:admin', client_id: registered.client_id }
    expect(await oauth.verify(tokens.access_token)).toEqual(identity)
    expect(authorized).not.toHaveBeenCalled()
    expect(await oauth.canAuthorize(identity.sub)).toBe(false)
    await expect(oauth.token(refresh, headers)).rejects.toThrow()
    expect(await oauth.verify(tokens.access_token)).toEqual(identity)
  })

  it('rejects credentials and policy after deleting the user cascades to grants and tokens', async () => {
    const { tokens, refresh } = await connected()
    await database.delete(users).where(eq(users.id, 'team'))
    authorized.mockClear()
    expect(await oauth.verify(tokens.access_token)).toBe(false)
    expect(await oauth.canAuthorize('team')).toBe(false)
    expect(authorized).not.toHaveBeenCalled()
    await expect(oauth.token(refresh, headers)).rejects.toThrow()
    expect(await database.select().from(mcpOAuthGrants)).toHaveLength(0)
    expect(await database.select().from(mcpOAuthTokens)).toHaveLength(0)
  })

  it('rejects expired codes, access tokens and refresh grants', async () => {
    const { exchange } = await connection()
    await database.update(mcpOAuthGrants).set({ codeExpiresAt: new Date(0) })
    await expect(oauth.token(exchange, headers)).rejects.toThrow()
    const { tokens, refresh } = await connected()
    await database.update(mcpOAuthTokens).set({ accessExpiresAt: new Date(0) })
    expect(await oauth.verify(tokens.access_token)).toBe(false)
    await database.update(mcpOAuthTokens).set({ accessExpiresAt: new Date(Date.now() + 900_000) })
    await database.update(mcpOAuthGrants).set({ expiresAt: new Date(0) })
    expect(await oauth.verify(tokens.access_token)).toBe(false)
    await expect(oauth.token(refresh, headers)).rejects.toThrow()
    await oauth.cleanup()
    expect(await database.select().from(mcpOAuthTokens)).toHaveLength(0)
  })

  it('revokes by either token without exposing unknown or wrong-client tokens', async () => {
    const { tokens, registered } = await connected()
    await oauth.revoke(tokens.access_token, 'another-client')
    expect(await oauth.verify(tokens.access_token)).toBeTruthy()
    await oauth.revoke(tokens.refresh_token!, registered.client_id)
    expect(await oauth.verify(tokens.access_token)).toBe(false)
    await expect(oauth.revoke('unknown', registered.client_id)).resolves.toBeUndefined()
  })

  it('does not treat GitHub provider tokens or the old shared token as MCP access tokens', async () => {
    expect(await oauth.verify('gho_example')).toBe(false)
    expect(await oauth.verify('old-shared-secret')).toBe(false)
  })

  it('requires a canonical issuer rather than a request Host', () => {
    expect(mcpOAuthUrls('http://localhost:3000').resource).toBe('http://localhost:3000/mcp/admin')
    for (const value of ['http://evil.example', 'https://nuxt.com/path', 'https://nuxt.com/', 'https://user@nuxt.com']) {
      expect(() => mcpOAuthUrls(value)).toThrow()
    }
  })
})
