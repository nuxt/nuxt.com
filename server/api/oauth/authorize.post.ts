// Records the signed-in admin's consent and returns where to send the browser next.
export default defineEventHandler(async (event) => {
  // The session cookie is SameSite=Lax; this also refuses cross-site requests from older browsers.
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site && site !== 'same-origin') throw createError({ statusCode: 403, statusMessage: 'Cross-site request refused' })

  const { user } = await requireUserSession(event)
  const body = await readBody<Record<string, unknown>>(event)
  let request: McpAuthorizationRequest
  try {
    request = await parseMcpAuthorizationRequest(getQuery(event))
  } catch (error) {
    if (!(error instanceof McpOAuthError)) throw error
    if (error.redirect) return { redirect: error.redirect }
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  if (body?.approve !== true) {
    return { redirect: authorizationRedirect(request.redirectUri, { error: 'access_denied', state: request.state }) }
  }

  // The role was set at sign-in; re-check before granting access.
  if (user.role !== 'admin' || !(await isAuthorizedAdmin(event, user.username))) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const code = await createMcpAuthorizationCode(request, user.id)
  return { redirect: authorizationRedirect(request.redirectUri, { code, state: request.state }) }
})
