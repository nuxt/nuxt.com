// Describes an authorization request for the consent page at /oauth/authorize.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  let request: McpAuthorizationRequest
  try {
    request = await parseMcpAuthorizationRequest(getQuery(event))
  } catch (error) {
    if (!(error instanceof McpOAuthError)) throw error
    return { status: 'error' as const, error: error.message, redirect: error.redirect }
  }

  const deny = authorizationRedirect(request.redirectUri, { error: 'access_denied', state: request.state })
  const session = await getUserSession(event)
  if (!session.user) return { status: 'login' as const }
  if (session.user.role !== 'admin') {
    return { status: 'error' as const, error: 'The admin MCP server is only available to Nuxt admins.', redirect: deny as string | undefined }
  }

  return {
    status: 'consent' as const,
    client: { name: request.client.name, redirectHost: redirectHost(request.redirectUri) },
    resource: mcpAdminResource().replace(/^https?:\/\//, ''),
    user: { username: session.user.username, avatar: session.user.avatar },
    scopes: request.scopes.map(scope => ({ scope, description: MCP_OAUTH_SCOPES[scope] })),
    deny
  }
})

function redirectHost(uri: string) {
  const url = new URL(uri)
  return url.host ? `${url.protocol}//${url.host}` : url.protocol
}
