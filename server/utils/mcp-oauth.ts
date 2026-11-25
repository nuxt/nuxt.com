import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull, lt } from 'drizzle-orm'
import { jwtVerify, SignJWT } from 'jose'
import { deriveSecret } from 'nuxt/server'
import type { H3Event } from 'h3'
import { MCP_OAUTH_SCOPE_LIST, MCP_OAUTH_SCOPES, mcpAdminResource, mcpOAuthIssuer } from '../../shared/utils/mcp-admin'
import type { McpOAuthScope } from '../../shared/utils/mcp-admin'

/**
 * nuxt.com is the OAuth 2.1 authorization server for its admin MCP endpoint:
 * people sign in with the site's GitHub login, and MCP clients get short-lived
 * access tokens bound to `/mcp/admin`. The toolkit verifies them as the
 * resource server in `server/mcp-admin/index.ts`.
 */

const CODE_TTL = 60
const ACCESS_TOKEN_TTL = 60 * 60
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60

export function mcpOAuthMetadata() {
  const issuer = mcpOAuthIssuer()
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    scopes_supported: MCP_OAUTH_SCOPE_LIST,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    authorization_response_iss_parameter_supported: true,
    service_documentation: `${issuer}/docs/4.x/guide/ai/mcp`
  }
}

export class McpOAuthError extends Error {
  /** Where to send the browser with this error, when the redirect URI is trusted. */
  redirect?: string

  constructor(public error: string, description: string, public status = 400) {
    super(description)
  }
}

/** RFC 6749 error response: JSON, never cached, readable by browser-based clients. */
export function sendMcpOAuthError(event: H3Event, error: unknown) {
  if (!(error instanceof McpOAuthError)) throw error
  setResponseStatus(event, error.status)
  setResponseHeader(event, 'cache-control', 'no-store')
  return { error: error.error, error_description: error.message }
}

export function setMcpOAuthCors(event: H3Event) {
  setResponseHeaders(event, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version',
    'access-control-max-age': 86400
  })
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
// Schemes a page or the OS must never hand an authorization code to.
const FORBIDDEN_SCHEMES = new Set(['javascript:', 'data:', 'file:', 'blob:', 'about:', 'vbscript:', 'ftp:', 'ws:', 'wss:'])

/**
 * Accepts HTTPS, loopback HTTP (RFC 8252 native apps on any port) and
 * private-use schemes such as `cursor://`. Fragments are never allowed.
 */
export function isAllowedRedirectUri(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.hash || url.username || url.password) return false
  if (url.protocol === 'https:') return true
  if (url.protocol === 'http:') return LOOPBACK_HOSTS.has(url.hostname)
  return !FORBIDDEN_SCHEMES.has(url.protocol) && /^[a-z][a-z0-9+.-]*:$/.test(url.protocol)
}

/** Exact match, except that loopback ports may differ (RFC 8252 §7.3). */
export function redirectUriMatches(registered: string[], requested: string): boolean {
  if (registered.includes(requested)) return true
  let url: URL
  try {
    url = new URL(requested)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' || !LOOPBACK_HOSTS.has(url.hostname)) return false
  return registered.some((candidate) => {
    const allowed = new URL(candidate)
    if (allowed.protocol !== 'http:' || allowed.hostname !== url.hostname) return false
    allowed.port = url.port
    return allowed.href === url.href
  })
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function randomToken(): string {
  return randomBytes(32).toString('base64url')
}

async function signingKey(purpose: 'client' | 'access'): Promise<Uint8Array> {
  return new TextEncoder().encode(await deriveSecret(`nuxt.com:mcp-oauth:${purpose}`))
}

export interface McpOAuthClient {
  /** Short, stable identifier recorded on grants and tokens. */
  key: string
  name: string
  redirectUris: string[]
}

/**
 * Clients register dynamically (RFC 7591) without a database row: the
 * client ID is a signed record of the registration itself.
 */
export async function registerMcpOAuthClient(input: { client_name?: unknown, redirect_uris?: unknown }) {
  const redirectUris = input.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.length === 0 || redirectUris.length > 10
    || !redirectUris.every(uri => typeof uri === 'string' && uri.length <= 2048 && isAllowedRedirectUri(uri))) {
    throw new McpOAuthError('invalid_redirect_uri', 'redirect_uris must list HTTPS, loopback HTTP or private-use scheme URIs without fragments.')
  }
  const name = typeof input.client_name === 'string' && input.client_name.trim()
    ? input.client_name.trim().slice(0, 100)
    : 'MCP client'
  const issuedAt = Math.floor(Date.now() / 1000)
  const key = randomBytes(9).toString('base64url')

  const clientId = await new SignJWT({ name, redirect_uris: redirectUris })
    .setProtectedHeader({ alg: 'HS256', typ: 'mcp-client+jwt' })
    .setIssuer(mcpOAuthIssuer())
    .setJti(key)
    .setIssuedAt(issuedAt)
    .sign(await signingKey('client'))

  return {
    client_id: clientId,
    client_id_issued_at: issuedAt,
    client_name: name,
    redirect_uris: redirectUris as string[],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none'
  }
}

export async function readMcpOAuthClient(clientId: unknown): Promise<McpOAuthClient> {
  if (typeof clientId !== 'string' || !clientId) {
    throw new McpOAuthError('invalid_client', 'Missing client_id.', 401)
  }
  try {
    const { payload } = await jwtVerify(clientId, await signingKey('client'), {
      issuer: mcpOAuthIssuer(),
      typ: 'mcp-client+jwt',
      requiredClaims: ['jti']
    })
    const redirectUris = payload.redirect_uris
    if (!Array.isArray(redirectUris) || typeof payload.name !== 'string') throw new Error('Malformed client')
    return { key: payload.jti!, name: payload.name, redirectUris: redirectUris as string[] }
  } catch {
    throw new McpOAuthError('invalid_client', 'Unknown client_id. Register the client again.', 401)
  }
}

/** Requested scopes, defaulting to all of them; unknown scopes are an error. */
export function parseMcpOAuthScope(value: unknown): McpOAuthScope[] {
  if (value === undefined || value === null || value === '') return MCP_OAUTH_SCOPE_LIST
  if (typeof value !== 'string') throw new McpOAuthError('invalid_scope', 'scope must be a string.')
  const requested = [...new Set(value.split(' ').filter(Boolean))]
  const unknown = requested.filter(scope => !(scope in MCP_OAUTH_SCOPES))
  if (unknown.length) throw new McpOAuthError('invalid_scope', `Unknown scope: ${unknown.join(', ')}.`)
  return requested.length ? requested as McpOAuthScope[] : MCP_OAUTH_SCOPE_LIST
}

/** RFC 8707: the only resource this server issues tokens for is the admin MCP endpoint. */
export function assertMcpAdminResource(value: unknown) {
  if (value === undefined || value === null || value === '') return
  const values = Array.isArray(value) ? value : [value]
  if (values.some(item => typeof item !== 'string' || item.replace(/\/+$/, '') !== mcpAdminResource())) {
    throw new McpOAuthError('invalid_target', `Tokens are only issued for ${mcpAdminResource()}.`)
  }
}

export interface McpAuthorizationRequest {
  client: McpOAuthClient
  redirectUri: string
  state?: string
  scopes: McpOAuthScope[]
  codeChallenge: string
}

/**
 * Validates an authorization request. Errors about the client or redirect URI
 * are shown to the person and never sent to the redirect URI (RFC 6749 §4.1.2.1);
 * other errors carry the redirect that reports them to the client.
 */
export async function parseMcpAuthorizationRequest(query: Record<string, unknown>): Promise<McpAuthorizationRequest> {
  const client = await readMcpOAuthClient(query.client_id)
  const redirectUri = typeof query.redirect_uri === 'string'
    ? query.redirect_uri
    : client.redirectUris.length === 1 ? client.redirectUris[0]! : ''
  if (!redirectUri || !redirectUriMatches(client.redirectUris, redirectUri)) {
    throw new McpOAuthError('invalid_request', 'redirect_uri does not match the registered client.')
  }

  const state = typeof query.state === 'string' ? query.state : undefined
  try {
    if (query.response_type !== 'code') throw new McpOAuthError('unsupported_response_type', 'Only response_type=code is supported.')
    if (typeof query.code_challenge !== 'string' || !/^[\w-]{43,128}$/.test(query.code_challenge) || query.code_challenge_method !== 'S256') {
      throw new McpOAuthError('invalid_request', 'PKCE with code_challenge_method=S256 is required.')
    }
    assertMcpAdminResource(query.resource)
    const scopes = parseMcpOAuthScope(query.scope)
    return { client, redirectUri, state, scopes, codeChallenge: query.code_challenge }
  } catch (error) {
    if (error instanceof McpOAuthError) {
      error.redirect = authorizationRedirect(redirectUri, { error: error.error, error_description: error.message, state })
    }
    throw error
  }
}

export function authorizationRedirect(redirectUri: string, params: Record<string, string | undefined>): string {
  const url = new URL(redirectUri)
  for (const [key, value] of Object.entries({ ...params, iss: mcpOAuthIssuer() })) {
    if (value !== undefined) url.searchParams.set(key, value)
  }
  return url.href
}

export async function createMcpAuthorizationCode(request: McpAuthorizationRequest, userId: string): Promise<string> {
  const code = randomToken()
  await db.insert(schema.mcpOAuthGrants).values({
    id: hashToken(code),
    kind: 'code',
    familyId: crypto.randomUUID(),
    userId,
    clientId: request.client.key,
    scope: request.scopes.join(' '),
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    expiresAt: new Date(Date.now() + CODE_TTL * 1000)
  })
  return code
}

type Grant = typeof schema.mcpOAuthGrants.$inferSelect

/**
 * Marks a code or refresh token used, once. Presenting one again revokes
 * every token issued from the same authorization (RFC 9700 §4.14.2).
 */
export async function consumeMcpGrant(kind: Grant['kind'], token: unknown): Promise<Grant> {
  if (typeof token !== 'string' || !token) {
    throw new McpOAuthError('invalid_request', `Missing ${kind === 'code' ? 'code' : 'refresh_token'}.`)
  }
  const id = hashToken(token)
  const now = new Date()
  const [grant] = await db.update(schema.mcpOAuthGrants)
    .set({ usedAt: now })
    .where(and(
      eq(schema.mcpOAuthGrants.id, id),
      eq(schema.mcpOAuthGrants.kind, kind),
      isNull(schema.mcpOAuthGrants.usedAt),
      gt(schema.mcpOAuthGrants.expiresAt, now)
    ))
    .returning()
  if (grant) return grant

  const replayed = await db.query.mcpOAuthGrants.findFirst({ where: () => eq(schema.mcpOAuthGrants.id, id) })
  if (replayed?.usedAt) await revokeMcpGrantFamily(replayed.familyId)
  throw new McpOAuthError('invalid_grant', `The ${kind === 'code' ? 'authorization code' : 'refresh token'} is invalid, expired or already used.`)
}

export async function revokeMcpGrantFamily(familyId: string) {
  await db.delete(schema.mcpOAuthGrants).where(eq(schema.mcpOAuthGrants.familyId, familyId))
}

/** Drops grants that expired more than a day ago; reuse detection only needs recent ones. */
export async function pruneMcpGrants() {
  await db.delete(schema.mcpOAuthGrants)
    .where(lt(schema.mcpOAuthGrants.expiresAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
}

export async function issueMcpTokens(grant: Pick<Grant, 'familyId' | 'userId' | 'clientId'>, scopes: string[], username: string) {
  const issuer = mcpOAuthIssuer()
  const accessToken = await new SignJWT({ scope: scopes.join(' '), client_id: grant.clientId, login: username })
    .setProtectedHeader({ alg: 'HS256', typ: 'at+jwt' })
    .setIssuer(issuer)
    .setAudience(mcpAdminResource())
    .setSubject(grant.userId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(await signingKey('access'))

  const refreshToken = randomToken()
  await db.insert(schema.mcpOAuthGrants).values({
    id: hashToken(refreshToken),
    kind: 'refresh',
    familyId: grant.familyId,
    userId: grant.userId,
    clientId: grant.clientId,
    scope: scopes.join(' '),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000)
  })

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL,
    refresh_token: refreshToken,
    scope: scopes.join(' ')
  }
}

/** Verifies an access token this server issued for the admin MCP endpoint. */
export async function verifyMcpAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, await signingKey('access'), {
      issuer: mcpOAuthIssuer(),
      audience: mcpAdminResource(),
      typ: 'at+jwt',
      requiredClaims: ['exp', 'sub', 'scope'],
      clockTolerance: 5
    })
    return typeof payload.sub === 'string' && payload.sub ? payload : null
  } catch {
    return null
  }
}
