import { eq } from 'drizzle-orm'

// Token endpoint for public MCP clients: authorization code with PKCE, and rotating refresh tokens.
export default defineEventHandler(async (event) => {
  setMcpOAuthCors(event)
  if (event.method === 'OPTIONS') return sendNoContent(event)
  if (event.method !== 'POST') throw createError({ statusCode: 405 })
  setResponseHeaders(event, { 'cache-control': 'no-store', 'pragma': 'no-cache' })

  try {
    const body = await readBody<Record<string, unknown>>(event).catch(() => null) ?? {}
    await pruneMcpGrants()

    if (body.grant_type === 'authorization_code') {
      const client = await readMcpOAuthClient(body.client_id)
      const grant = await consumeMcpGrant('code', body.code)
      if (grant.clientId !== client.key || grant.redirectUri !== body.redirect_uri) {
        await revokeMcpGrantFamily(grant.familyId)
        throw new McpOAuthError('invalid_grant', 'The authorization code was issued to another client or redirect URI.')
      }
      if (typeof body.code_verifier !== 'string' || pkceChallenge(body.code_verifier) !== grant.codeChallenge) {
        await revokeMcpGrantFamily(grant.familyId)
        throw new McpOAuthError('invalid_grant', 'The PKCE code_verifier does not match.')
      }
      assertMcpAdminResource(body.resource)

      const user = await db.query.users.findFirst({ where: () => eq(schema.users.id, grant.userId) })
      if (!user) throw new McpOAuthError('invalid_grant', 'The account no longer exists.')
      return await issueMcpTokens(grant, grant.scope.split(' '), user.username)
    }

    if (body.grant_type === 'refresh_token') {
      const client = await readMcpOAuthClient(body.client_id)
      const grant = await consumeMcpGrant('refresh', body.refresh_token)
      if (grant.clientId !== client.key) {
        await revokeMcpGrantFamily(grant.familyId)
        throw new McpOAuthError('invalid_grant', 'The refresh token was issued to another client.')
      }
      assertMcpAdminResource(body.resource)

      // A refresh can only narrow the scopes of the original grant.
      const granted = grant.scope.split(' ')
      const scopes = body.scope === undefined ? granted : parseMcpOAuthScope(body.scope)
      if (scopes.some(scope => !granted.includes(scope))) {
        throw new McpOAuthError('invalid_scope', 'A refresh cannot add scopes.')
      }

      // Leaving the admins ends MCP access at the next refresh, at most one access-token lifetime later.
      const user = await db.query.users.findFirst({ where: () => eq(schema.users.id, grant.userId) })
      if (!user || !(await isAuthorizedAdmin(event, user.username))) {
        await revokeMcpGrantFamily(grant.familyId)
        throw new McpOAuthError('invalid_grant', 'This account no longer has admin access.')
      }
      return await issueMcpTokens(grant, scopes, user.username)
    }

    throw new McpOAuthError('unsupported_grant_type', 'Use authorization_code or refresh_token.')
  } catch (error) {
    return sendMcpOAuthError(event, error)
  }
})
