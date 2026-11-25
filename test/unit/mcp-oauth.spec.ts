import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { decodeJwt, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as schema from '../../server/db/schema'

vi.mock('nuxt/server', () => ({ deriveSecret: async (purpose: string) => `test-root-secret:${purpose}` }))

const db = drizzle(createClient({ url: ':memory:' }), { schema })
vi.stubGlobal('db', db)
vi.stubGlobal('schema', schema)

const oauth = await import('../../server/utils/mcp-oauth')

beforeAll(async () => {
  const statements = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson({ mcpOAuthGrants: schema.mcpOAuthGrants }))
  for (const statement of statements) await db.run(statement)
})

const challenge = oauth.pkceChallenge('verifier-'.repeat(6))

async function authorize(query: Record<string, string> = {}) {
  const { client_id } = await oauth.registerMcpOAuthClient({ client_name: 'Test', redirect_uris: ['http://127.0.0.1:33418/callback'] })
  return oauth.parseMcpAuthorizationRequest({
    client_id,
    response_type: 'code',
    redirect_uri: 'http://127.0.0.1:33418/callback',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...query
  })
}

describe('admin MCP OAuth server', () => {
  it('accepts only HTTPS, loopback HTTP and private-use redirect URIs', () => {
    for (const uri of ['https://claude.ai/api/mcp/auth_callback', 'http://127.0.0.1:33418/callback', 'http://localhost/cb', 'cursor://anysphere.cursor-mcp/oauth/callback']) {
      expect(oauth.isAllowedRedirectUri(uri), uri).toBe(true)
    }
    for (const uri of ['http://evil.example/cb', 'javascript:alert(1)', 'data:text/html,x', 'https://claude.ai/cb#frag', 'https://user:pass@claude.ai/cb', 'not a url']) {
      expect(oauth.isAllowedRedirectUri(uri), uri).toBe(false)
    }
  })

  it('lets only the loopback port vary from the registered redirect URI', () => {
    const registered = ['http://127.0.0.1/callback', 'https://claude.ai/cb']
    expect(oauth.redirectUriMatches(registered, 'http://127.0.0.1:51234/callback')).toBe(true)
    expect(oauth.redirectUriMatches(registered, 'http://127.0.0.1:51234/other')).toBe(false)
    expect(oauth.redirectUriMatches(registered, 'http://localhost:51234/callback')).toBe(false)
    expect(oauth.redirectUriMatches(registered, 'https://claude.ai:8443/cb')).toBe(false)
  })

  it('rejects a client ID whose registration was edited', async () => {
    const { client_id } = await oauth.registerMcpOAuthClient({ redirect_uris: ['https://claude.ai/cb'] })
    const [header, , signature] = client_id.split('.')
    const payload = Buffer.from(JSON.stringify({ ...decodeJwt(client_id), redirect_uris: ['https://evil.example/cb'] })).toString('base64url')
    await expect(oauth.readMcpOAuthClient(`${header}.${payload}.${signature}`)).rejects.toMatchObject({ error: 'invalid_client' })
  })

  it('reports errors to the client only once its redirect URI is trusted', async () => {
    await expect(authorize({ redirect_uri: 'https://evil.example/cb' })).rejects.toMatchObject({ redirect: undefined })
    await expect(authorize({ code_challenge_method: 'plain' })).rejects.toMatchObject({ error: 'invalid_request', redirect: expect.stringMatching(/^http:\/\/127\.0\.0\.1:33418\/callback\?error=invalid_request/) })
    await expect(authorize({ resource: 'http://localhost:3000/mcp' })).rejects.toMatchObject({ error: 'invalid_target' })
    await expect(authorize({ scope: 'admin:analytics admin:write' })).rejects.toMatchObject({ error: 'invalid_scope' })
  })

  it('issues access tokens bound to the admin MCP resource', async () => {
    const request = await authorize({ scope: 'admin:analytics' })
    const tokens = await oauth.issueMcpTokens({ familyId: 'f-aud', userId: 'user-1', clientId: request.client.key }, request.scopes, 'atinux')
    expect(await oauth.verifyMcpAccessToken(tokens.access_token)).toMatchObject({ sub: 'user-1', scope: 'admin:analytics', aud: 'http://localhost:3000/mcp/admin' })

    const secret = new TextEncoder().encode('test-root-secret:nuxt.com:mcp-oauth:access')
    const otherAudience = await new SignJWT({ scope: 'admin:chats' }).setProtectedHeader({ alg: 'HS256', typ: 'at+jwt' })
      .setIssuer('http://localhost:3000').setAudience('http://localhost:3000/mcp').setSubject('user-1').setExpirationTime('1h').sign(secret)
    expect(await oauth.verifyMcpAccessToken(otherAudience)).toBeNull()
    // A client ID is signed with another key and never works as an access token.
    expect(await oauth.verifyMcpAccessToken(request.client.key)).toBeNull()
  })

  it('consumes a code once and revokes its tokens when the code is replayed', async () => {
    const request = await authorize()
    const code = await oauth.createMcpAuthorizationCode(request, 'user-1')
    const grant = await oauth.consumeMcpGrant('code', code)
    expect(grant).toMatchObject({ userId: 'user-1', codeChallenge: challenge, scope: 'admin:analytics admin:chats' })

    const { refresh_token } = await oauth.issueMcpTokens(grant, request.scopes, 'atinux')
    await expect(oauth.consumeMcpGrant('code', code)).rejects.toMatchObject({ error: 'invalid_grant' })
    await expect(oauth.consumeMcpGrant('refresh', refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  it('rotates refresh tokens and revokes the family when an old one is replayed', async () => {
    const request = await authorize()
    const grant = await oauth.consumeMcpGrant('code', await oauth.createMcpAuthorizationCode(request, 'user-2'))
    const first = await oauth.issueMcpTokens(grant, request.scopes, 'danielroe')
    const second = await oauth.issueMcpTokens(await oauth.consumeMcpGrant('refresh', first.refresh_token), request.scopes, 'danielroe')

    await expect(oauth.consumeMcpGrant('refresh', first.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' })
    await expect(oauth.consumeMcpGrant('refresh', second.refresh_token)).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  it('trusts a client metadata document only for its own URL, and checks its private_key_jwt assertions', async () => {
    const clientId = 'https://connect.example/connectors/nuxi'
    const { privateKey, publicKey } = await generateKeyPair('ES256')
    const documents: Record<string, unknown> = {
      [clientId]: { client_id: clientId, client_name: 'nuxi', token_endpoint_auth_method: 'private_key_jwt', redirect_uris: ['https://connect.example/callback'], jwks_uri: 'https://connect.example/jwks.json' },
      'https://connect.example/jwks.json': { keys: [{ ...await exportJWK(publicKey), kid: 'k1', alg: 'ES256' }] },
      'https://connect.example/connectors/impostor': { client_id: clientId, redirect_uris: ['https://evil.example/cb'] },
      'https://connect.example/connectors/secret': { client_id: 'https://connect.example/connectors/secret', client_secret: 'x', redirect_uris: ['https://connect.example/cb'] }
    }
    vi.stubGlobal('fetch', async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input)
      return url in documents ? Response.json(documents[url]) : new Response('Not found', { status: 404 })
    })
    const assertion = (key: CryptoKey, audience = 'http://localhost:3000/oauth/token') => new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' }).setIssuer(clientId).setSubject(clientId).setAudience(audience)
      .setJti(crypto.randomUUID()).setExpirationTime('1m').sign(key)
    const body = async (key = privateKey, audience?: string) => ({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: await assertion(key, audience)
    })

    try {
      const request = await oauth.parseMcpAuthorizationRequest({
        client_id: clientId, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256'
      })
      expect(request).toMatchObject({ client: { key: clientId, name: 'nuxi' }, redirectUri: 'https://connect.example/callback' })

      // The client_id can come from the assertion's issuer alone.
      await expect(oauth.authenticateMcpOAuthClient(await body())).resolves.toMatchObject({ key: clientId })
      await expect(oauth.authenticateMcpOAuthClient({ client_id: clientId })).rejects.toMatchObject({ error: 'invalid_client' })
      await expect(oauth.authenticateMcpOAuthClient(await body((await generateKeyPair('ES256')).privateKey))).rejects.toMatchObject({ error: 'invalid_client' })
      await expect(oauth.authenticateMcpOAuthClient(await body(privateKey, 'https://other.example'))).rejects.toMatchObject({ error: 'invalid_client' })

      for (const id of ['https://connect.example/connectors/impostor', 'https://connect.example/connectors/secret', 'https://connect.example/missing', 'https://connect.example/', 'https://127.0.0.1/client', 'https://connect.example/a/../connectors/nuxi']) {
        await expect(oauth.readMcpOAuthClient(id), id).rejects.toMatchObject({ error: 'invalid_client' })
      }
    } finally {
      vi.unstubAllGlobals()
      vi.stubGlobal('db', db)
      vi.stubGlobal('schema', schema)
    }
  })
})
