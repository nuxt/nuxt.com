import { createHash, randomBytes } from 'node:crypto'
import OAuth2Server from '@node-oauth/oauth2-server'
import { and, eq, gt, isNull, lt, notInArray, or } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { z } from 'zod'
import { mcpOAuthClients, mcpOAuthGrants, mcpOAuthTokens, users } from '../db/schema'

const SCOPE = 'nuxt:admin'
const userSchema = z.object({ id: z.string() })
const authorizeSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1).max(256),
  redirect_uri: z.string().url().max(2048),
  resource: z.string().url(),
  scope: z.literal(SCOPE).default(SCOPE),
  state: z.string().min(1).max(1024).regex(/^[\x20-\x7E]+$/).optional(),
  code_challenge: z.string().regex(/^[\w-]{43}$/),
  code_challenge_method: z.literal('S256')
})
const registrationSchema = z.object({
  client_name: z.string().trim().min(1).max(100).default('MCP client'),
  redirect_uris: z.array(z.string().url().max(2048)).min(1).max(5),
  token_endpoint_auth_method: z.literal('none').default('none'),
  grant_types: z.array(z.enum(['authorization_code', 'refresh_token'])).min(1).max(2).default(['authorization_code', 'refresh_token']),
  response_types: z.array(z.literal('code')).length(1).default(['code'])
})

export const oauthSecret = () => randomBytes(32).toString('base64url')
export const oauthHash = (value: string) => createHash('sha256').update(value).digest('hex')
export type AdminMcpAuthorization = z.infer<typeof authorizeSchema>

export function mcpOAuthUrls(issuer: string) {
  const url = new URL(issuer)
  if (url.origin !== issuer || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
    throw new Error('MCP OAuth issuer must be an HTTPS origin (HTTP is allowed on loopback)')
  }
  return {
    issuer,
    resource: `${issuer}/mcp/admin`,
    metadata: `${issuer}/.well-known/oauth-protected-resource/mcp/admin`,
    authorize: `${issuer}/api/mcp/oauth/authorize`,
    token: `${issuer}/api/mcp/oauth/token`,
    register: `${issuer}/api/mcp/oauth/register`,
    revoke: `${issuer}/api/mcp/oauth/revoke`
  }
}

function validRedirect(value: string) {
  const url = new URL(value)
  return !url.hash && !url.username && !url.password
    && (url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)))
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new OAuth2Server.InvalidRequestError('Invalid OAuth request parameters')
  return result.data
}

export function createAdminMcpOAuth<TSchema extends Record<string, unknown>>(
  database: LibSQLDatabase<TSchema>,
  issuer: string,
  isAuthorized: (user: { id: string, username: string, providerId: string }) => Promise<boolean>
) {
  const urls = mcpOAuthUrls(issuer)
  const clientFor = async (id: string) => {
    const [row] = await database.select().from(mcpOAuthClients).where(eq(mcpOAuthClients.id, id))
    return row && { id: row.id, redirectUris: row.redirectUris, grants: row.grants }
  }
  const authorizedUser = async (id: string) => {
    const [user] = await database.select().from(users).where(eq(users.id, id))
    return user && await isAuthorized(user) ? { id: user.id } : false
  }
  const activeGrant = async (id: string) => {
    const [grant] = await database.select().from(mcpOAuthGrants).where(and(
      eq(mcpOAuthGrants.id, id), isNull(mcpOAuthGrants.revokedAt), gt(mcpOAuthGrants.expiresAt, new Date())
    ))
    return grant
  }
  const revokeGrant = async (id: string) => {
    await database.update(mcpOAuthGrants).set({ revokedAt: new Date() }).where(eq(mcpOAuthGrants.id, id))
  }

  function engine(resource: string, clientId?: string) {
    if (resource !== urls.resource) throw new OAuth2Server.InvalidRequestError('The resource must be the admin MCP URL')
    let grantId: string | undefined
    const model: OAuth2Server.AuthorizationCodeModel & OAuth2Server.RefreshTokenModel = {
      getClient: async (id, secret) => secret ? false : clientFor(id),
      generateAccessToken: async () => oauthSecret(),
      generateRefreshToken: async () => oauthSecret(),
      generateAuthorizationCode: async () => oauthSecret(),
      validateScope: async (_user, _client, scope) => !scope || scope.every(value => value === SCOPE) ? [SCOPE] : false,
      validateRedirectUri: async (uri, client) => Array.isArray(client.redirectUris) && client.redirectUris.includes(uri),
      getAccessToken: async () => false,
      saveAuthorizationCode: async (code, client, user) => {
        const identity = parse(userSchema, user)
        const id = crypto.randomUUID()
        await database.insert(mcpOAuthGrants).values({
          id, clientId: client.id, userId: identity.id, resource,
          codeHash: oauthHash(code.authorizationCode), codeExpiresAt: code.expiresAt,
          redirectUri: code.redirectUri, challenge: z.string().parse(code.codeChallenge),
          expiresAt: new Date(Date.now() + 30 * 86400_000)
        })
        return { ...code, client, user }
      },
      getAuthorizationCode: async (code) => {
        const [row] = await database.select().from(mcpOAuthGrants).where(and(
          eq(mcpOAuthGrants.codeHash, oauthHash(code)), eq(mcpOAuthGrants.resource, resource),
          isNull(mcpOAuthGrants.revokedAt)
        ))
        if (!row) return false
        if (row.codeUsedAt && row.clientId === clientId) {
          await revokeGrant(row.id)
          return false
        }
        const client = await clientFor(row.clientId)
        const user = await authorizedUser(row.userId)
        if (!client || !user) return false
        grantId = row.id
        return {
          authorizationCode: code, expiresAt: row.codeExpiresAt, redirectUri: row.redirectUri,
          codeChallenge: row.challenge, codeChallengeMethod: 'S256', scope: [SCOPE], client, user
        }
      },
      revokeAuthorizationCode: async (code) => {
        const claimed = await database.update(mcpOAuthGrants).set({ codeUsedAt: new Date() }).where(and(
          eq(mcpOAuthGrants.codeHash, oauthHash(code.authorizationCode)), isNull(mcpOAuthGrants.codeUsedAt)
        )).returning({ id: mcpOAuthGrants.id })
        if (!claimed.length && grantId) await revokeGrant(grantId)
        return claimed.length === 1
      },
      getRefreshToken: async (refreshToken) => {
        const [row] = await database.select().from(mcpOAuthTokens).where(eq(mcpOAuthTokens.refreshHash, oauthHash(refreshToken)))
        if (!row || row.clientId !== clientId) return false
        if (row.refreshUsedAt) {
          await revokeGrant(row.grantId)
          return false
        }
        const grant = await activeGrant(row.grantId)
        if (!grant || grant.resource !== resource) return false
        const client = await clientFor(row.clientId)
        const user = await authorizedUser(grant.userId)
        if (!client || !user) return false
        grantId = grant.id
        return { refreshToken, refreshTokenExpiresAt: row.refreshExpiresAt, scope: [SCOPE], client, user }
      },
      revokeToken: async (token) => {
        const claimed = await database.update(mcpOAuthTokens).set({ refreshUsedAt: new Date() }).where(and(
          eq(mcpOAuthTokens.refreshHash, oauthHash(token.refreshToken)), isNull(mcpOAuthTokens.refreshUsedAt)
        )).returning({ id: mcpOAuthTokens.id })
        if (!claimed.length && grantId) await revokeGrant(grantId)
        return claimed.length === 1
      },
      saveToken: async (token, client, user) => {
        if (!grantId) throw new Error('Missing MCP OAuth grant')
        const grant = await activeGrant(grantId)
        if (!grant) throw new OAuth2Server.InvalidGrantError('Authorization has been revoked')
        const accessToken = z.string().parse(token.accessToken)
        const refreshToken = z.string().parse(token.refreshToken)
        const accessTokenExpiresAt = z.date().parse(token.accessTokenExpiresAt)
        const refreshTokenExpiresAt = grant.expiresAt
        await database.insert(mcpOAuthTokens).values({
          grantId, clientId: client.id, accessHash: oauthHash(accessToken),
          accessExpiresAt: accessTokenExpiresAt, refreshHash: oauthHash(refreshToken),
          refreshExpiresAt: refreshTokenExpiresAt
        })
        return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, scope: [SCOPE], client, user }
      }
    }
    return new OAuth2Server({
      model, requirePKCE: true, allowEmptyState: true, authorizationCodeLifetime: 120,
      accessTokenLifetime: 900, refreshTokenLifetime: 30 * 86400,
      requireClientAuthentication: { authorization_code: false, refresh_token: false },
      alwaysIssueNewRefreshToken: true
    })
  }

  return {
    urls,
    canAuthorize: authorizedUser,
    async register(input: unknown, registrationKey: string) {
      const data = parse(registrationSchema, input)
      if (!data.grant_types.includes('authorization_code') || !data.redirect_uris.every(validRedirect)) {
        throw new OAuth2Server.InvalidRequestError('Register an authorization-code client with HTTPS or loopback redirect URIs')
      }
      const id = oauthSecret()
      await database.insert(mcpOAuthClients).values({ id, registrationKey, name: data.client_name, redirectUris: data.redirect_uris, grants: data.grant_types })
      return { ...data, client_id: id, client_id_issued_at: Math.floor(Date.now() / 1000) }
    },
    async validateAuthorization(input: unknown) {
      const request = parse(authorizeSchema, input)
      if (request.resource !== urls.resource) throw new OAuth2Server.InvalidRequestError('Invalid resource')
      const [client] = await database.select().from(mcpOAuthClients).where(eq(mcpOAuthClients.id, request.client_id))
      if (!client || !client.redirectUris.includes(request.redirect_uri)) throw new OAuth2Server.InvalidClientError('Unregistered client or redirect URI')
      return { request, client: { name: client.name, redirectUri: request.redirect_uri } }
    },
    async authorize(input: AdminMcpAuthorization, userId: string, allowed: boolean) {
      const { request } = await this.validateAuthorization(input)
      const user = await authorizedUser(userId)
      if (!user) throw new OAuth2Server.AccessDeniedError('Nuxt team access required')
      const redirect = new URL(request.redirect_uri)
      if (request.state) redirect.searchParams.set('state', request.state)
      if (!allowed) {
        redirect.searchParams.set('error', 'access_denied')
        return redirect.href
      }
      const code = await engine(request.resource).authorize(new OAuth2Server.Request({
        method: 'GET', headers: {}, query: request, body: {}
      }), new OAuth2Server.Response(), { authenticateHandler: { handle: () => user } })
      redirect.searchParams.set('code', code.authorizationCode)
      return redirect.href
    },
    async token(body: Record<string, string>, headers: Record<string, string>) {
      const server = engine(body.resource || '', body.client_id)
      const token = await server.token(new OAuth2Server.Request({ method: 'POST', headers: { ...headers, 'content-length': String(Buffer.byteLength(new URLSearchParams(body).toString())) }, body, query: {} }), new OAuth2Server.Response())
      return {
        access_token: token.accessToken, token_type: 'Bearer',
        expires_in: Math.max(0, Math.floor((z.date().parse(token.accessTokenExpiresAt).getTime() - Date.now()) / 1000)),
        refresh_token: token.refreshToken, scope: SCOPE
      }
    },
    async verify(accessToken: string) {
      const [token] = await database.select().from(mcpOAuthTokens).where(and(
        eq(mcpOAuthTokens.accessHash, oauthHash(accessToken)), gt(mcpOAuthTokens.accessExpiresAt, new Date())
      ))
      if (!token) return false
      const grant = await activeGrant(token.grantId)
      if (!grant || grant.resource !== urls.resource) return false
      const user = await authorizedUser(grant.userId)
      return user && { sub: user.id, scope: SCOPE, client_id: token.clientId }
    },
    async revoke(token: string, clientId: string) {
      const [row] = await database.select().from(mcpOAuthTokens).where(and(
        eq(mcpOAuthTokens.clientId, clientId),
        or(eq(mcpOAuthTokens.accessHash, oauthHash(token)), eq(mcpOAuthTokens.refreshHash, oauthHash(token)))
      ))
      if (row) await revokeGrant(row.grantId)
    },
    async cleanup() {
      await database.delete(mcpOAuthGrants).where(lt(mcpOAuthGrants.expiresAt, new Date()))
      await database.delete(mcpOAuthClients).where(and(
        lt(mcpOAuthClients.createdAt, new Date(Date.now() - 90 * 86400_000)),
        notInArray(mcpOAuthClients.id, database.select({ id: mcpOAuthGrants.clientId }).from(mcpOAuthGrants))
      ))
    }
  }
}
