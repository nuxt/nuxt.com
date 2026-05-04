export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!user?.login || !(await isAuthorizedAdmin(user.login))) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { mcpAdminToken } = useRuntimeConfig(event)
  if (!mcpAdminToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'MCP admin token is not configured (NUXT_MCP_ADMIN_TOKEN env variable).'
    })
  }

  const name = 'nuxt-admin'
  const url = `${getRequestURL(event).origin}/mcp/admin`
  const headers = { Authorization: `Bearer ${mcpAdminToken}` }
  const json = { type: 'http' as const, url, headers }

  const cursorConfig = Buffer.from(JSON.stringify(json)).toString('base64')
  const cursorDeeplink = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(cursorConfig)}`

  const vscodeDeeplink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name, ...json }))}`

  return {
    name,
    url,
    token: mcpAdminToken,
    json,
    deeplinks: {
      cursor: cursorDeeplink,
      vscode: vscodeDeeplink
    }
  }
})
