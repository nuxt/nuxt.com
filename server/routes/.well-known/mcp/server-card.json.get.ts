import { listMcpDefinitions } from '@nuxtjs/mcp-toolkit/server'

export default defineCachedEventHandler(async (event) => {
  const domain = getSiteUrl(event)
  const { tools, resources, prompts } = await listMcpDefinitions()

  const isPublic = <T extends { group?: string }>(d: T) => d.group !== 'admin'

  const serverCard = {
    $schema: 'https://modelcontextprotocol.io/schema/server-card/v1',
    serverInfo: {
      name: 'Nuxt',
      title: 'Nuxt MCP Server',
      description: 'MCP server providing tools, resources and prompts to help AI agents build with Nuxt — search documentation, retrieve guides, fetch module metadata, and discover deployment providers.',
      homepage: domain,
      documentation: `${domain}/docs/${CURRENT_DOCS_VERSION}/guide/ai/mcp`,
      license: 'MIT',
      repository: 'https://github.com/nuxt/nuxt.com'
    },
    endpoints: [
      {
        type: 'streamable-http',
        url: `${domain}/mcp`
      }
    ],
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
      logging: {}
    },
    tools: tools.filter(isPublic).map(t => ({ name: t.name, description: t.description })),
    resources: resources.filter(isPublic).map(r => ({ name: r.name, uri: r.uri, description: r.description })),
    prompts: prompts.filter(isPublic).map(p => ({ name: p.name, description: p.description })),
    authentication: {
      required: false
    }
  }

  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  return serverCard
}, {
  name: 'well-known-mcp-server-card',
  swr: true,
  maxAge: 60 * 60
})
