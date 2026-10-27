import { agentDiscoveryOpenApi, getAgentSiteUrl } from '#agent-discovery'

// Prerendered (see `routeRules`), so there is nothing to cache at runtime,
// and the site URL is baked in at build like the other discovery documents.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  return createOpenApiDocument({
    url: getAgentSiteUrl(event),
    discovery: agentDiscoveryOpenApi(event, { paths: apiPaths })
  })
})
