import { eventHandler, setHeader } from 'h3'

const DOMAIN = 'https://nuxt.com'

export default eventHandler((event) => {
  const serverCard = {
    $schema: 'https://modelcontextprotocol.io/schema/server-card/v1',
    serverInfo: {
      name: 'Nuxt',
      title: 'Nuxt MCP Server',
      description: 'MCP server providing tools, resources and prompts to help AI agents build with Nuxt — search documentation, retrieve guides, fetch module metadata, and discover deployment providers.',
      homepage: DOMAIN,
      documentation: `${DOMAIN}/docs/guide/ai/mcp`,
      license: 'MIT',
      repository: 'https://github.com/nuxt/nuxt.com'
    },
    transport: {
      type: 'streamable-http',
      endpoint: `${DOMAIN}/mcp`
    },
    endpoints: [
      {
        type: 'streamable-http',
        url: `${DOMAIN}/mcp`
      }
    ],
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
      logging: {}
    },
    tools: [
      { name: 'list-documentation-pages', description: 'List all available Nuxt documentation pages with their categories and basic information.' },
      { name: 'get-documentation-page', description: 'Retrieve the full content and details of a specific Nuxt documentation page.' },
      { name: 'get-getting-started-guide', description: 'Get the getting started guide for a specific Nuxt version.' },
      { name: 'list-modules', description: 'List all available Nuxt modules with optional filtering and sorting capabilities.' },
      { name: 'get-module', description: 'Retrieve complete details about a specific Nuxt module including README, compatibility, maintainers, and stats.' },
      { name: 'list-blog-posts', description: 'List all Nuxt blog posts with metadata including titles, dates, categories, tags, and descriptions.' },
      { name: 'get-blog-post', description: 'Retrieve the full content and details of a specific Nuxt blog post.' },
      { name: 'list-deploy-providers', description: 'List all deployment providers and hosting platforms for Nuxt applications with their features and capabilities.' },
      { name: 'get-deploy-provider', description: 'Retrieve detailed deployment instructions and setup guide for a specific hosting provider.' },
      { name: 'get-changelog', description: 'Retrieve the latest releases from Nuxt core and official modules (changelog).' }
    ],
    resources: [
      { name: 'documentation-pages', description: 'Catalog of all Nuxt documentation pages.' },
      { name: 'blog-posts', description: 'Catalog of all Nuxt blog posts.' },
      { name: 'deploy-providers', description: 'Catalog of all Nuxt deployment providers.' }
    ],
    prompts: [
      { name: 'find-documentation-for-topic', description: 'Find the best Nuxt documentation for a specific topic or feature.' },
      { name: 'deployment-guide', description: 'Get deployment instructions for a specific hosting provider.' },
      { name: 'migration-help', description: 'Get help with migrating between Nuxt versions.' }
    ],
    authentication: {
      required: false
    }
  }

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return serverCard
})
