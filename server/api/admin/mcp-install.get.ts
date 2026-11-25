export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  // No credentials: MCP clients sign in with GitHub through the endpoint's OAuth flow.
  const name = 'nuxt-admin'
  const url = mcpAdminResource()
  const json = { type: 'http' as const, url }

  const cursorConfig = Buffer.from(JSON.stringify(json)).toString('base64')

  return {
    name,
    url,
    json,
    deeplinks: {
      cursor: `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(cursorConfig)}`,
      vscode: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name, ...json }))}`
    },
    claudeCode: `claude mcp add --transport http ${name} ${url}`
  }
})
