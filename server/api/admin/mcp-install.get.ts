import { createError, defineHandler, getRequestURL, useRuntimeConfig } from 'nuxt/server'

export default defineHandler(async (event) => {
  await requireAdminUserSession(event)

  const { mcpAdminToken } = useRuntimeConfig()
  if (!mcpAdminToken) {
    throw createError({
      status: 503,
      statusText: 'MCP admin token is not configured (NUXT_MCP_ADMIN_TOKEN env variable).'
    })
  }

  const name = 'nuxt-admin'
  const url = `${getRequestURL(event, { xForwardedProto: true }).origin}/mcp/admin`
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
