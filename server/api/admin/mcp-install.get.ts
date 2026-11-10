export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!await adminMcpOAuth(event).canAuthorize(user.id)) {
    throw createError({ statusCode: 403, statusMessage: 'Nuxt team access required' })
  }

  const name = 'nuxt-admin'
  const url = adminMcpOAuthUrls(event).resource
  const json = { type: 'http' as const, url }

  const cursorConfig = Buffer.from(JSON.stringify(json)).toString('base64')
  const cursorDeeplink = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(cursorConfig)}`

  const vscodeDeeplink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name, ...json }))}`

  return {
    name,
    url,
    json,
    deeplinks: {
      cursor: cursorDeeplink,
      vscode: vscodeDeeplink
    }
  }
})
