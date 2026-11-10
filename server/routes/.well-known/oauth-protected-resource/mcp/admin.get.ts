export default defineEventHandler((event) => {
  const urls = adminMcpOAuthUrls(event)
  return {
    resource: urls.resource,
    authorization_servers: [urls.issuer],
    scopes_supported: ['nuxt:admin'],
    bearer_methods_supported: ['header'],
    resource_name: 'Nuxt Admin MCP'
  }
})
