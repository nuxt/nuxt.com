import { mcp } from 'nitro-mcp-toolkit/servers'
import { getAgentSiteUrl } from '#agent-discovery'
import { CURRENT_DOCS_VERSION } from '#shared/utils/docs'

export default defineEventHandler((event) => {
  setHeader(event, 'cache-control', 'no-cache')
  const siteUrl = getAgentSiteUrl(event)
  const summarize = (kind: string) => mcp.definitions
    .filter(definition => definition.kind === kind)
    .map(({ name, description }) => ({ name, description }))

  return {
    serverInfo: {
      name: 'Nuxt',
      title: 'Nuxt MCP Server',
      description: 'MCP server providing tools, resources and prompts to help AI agents build with Nuxt — search documentation, retrieve guides, fetch module metadata, discover deployment providers, and look up Nuxt contributors (Nuxters).',
      homepage: siteUrl,
      documentation: new URL(`/docs/${CURRENT_DOCS_VERSION}/guide/ai/mcp`, siteUrl).href,
      repository: 'https://github.com/nuxt/nuxt.com',
      license: 'MIT'
    },
    endpoints: [{ type: 'streamable-http', url: new URL('/mcp', siteUrl).href }],
    authentication: { required: false },
    capabilities: { tools: {}, resources: {}, prompts: {} },
    tools: summarize('tool'),
    resources: mcp.definitions.filter(definition => definition.kind === 'resource')
      .map(({ name, description, uri }) => ({ name, description, uri })),
    prompts: summarize('prompt')
  }
})
