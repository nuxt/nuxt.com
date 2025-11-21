import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

function createServer() {
  const server = new McpServer({
    name: 'nuxt-com',
    version: '1.0.0'
  })

  // RESOURCES

  server.registerResource(
    'nuxt-documentation-pages',
    'resource://nuxt-com/documentation-pages',
    {
      title: 'Nuxt Documentation Pages',
      description: 'Complete list of available Nuxt documentation pages (defaults to v4.x, use ?version=3.x or ?version=all for other versions)'
    },
    async (uri) => {
      const result = await $fetch('/api/mcp/list-documentation-pages', {
        query: { version: '4.x' }
      })
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2)
        }]
      }
    }
  )

  server.registerResource(
    'nuxt-blog-posts',
    'resource://nuxt-com/blog-posts',
    {
      title: 'Nuxt Blog Posts',
      description: 'Complete list of Nuxt blog posts including releases, tutorials, and announcements'
    },
    async (uri) => {
      const result = await $fetch('/api/mcp/list-blog-posts')
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2)
        }]
      }
    }
  )

  server.registerResource(
    'nuxt-deploy-providers',
    'resource://nuxt-com/deploy-providers',
    {
      title: 'Nuxt Deploy Providers',
      description: 'Complete list of deployment providers and hosting platforms for Nuxt applications'
    },
    async (uri) => {
      const result = await $fetch('/api/mcp/list-deploy-providers')
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2)
        }]
      }
    }
  )

  // PROMPTS

  server.registerPrompt(
    'find_documentation_for_topic',
    {
      title: 'Find Documentation for Topic',
      description: 'Find the best Nuxt documentation for a specific topic or feature',
      argsSchema: {
        topic: z.string().describe('Describe what you want to learn about (e.g., "server-side rendering", "data fetching", "routing")'),
        version: z.enum(['3.x', '4.x']).optional().describe('Documentation version to search (defaults to 4.x)')
      }
    },
    async ({ topic, version = '4.x' }) => {
      const allPages = await $fetch('/api/mcp/list-documentation-pages', {
        query: { version }
      })
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me find the best Nuxt documentation for this topic: "${topic}". Here are all available documentation pages. Please identify the most relevant pages based on their titles and descriptions, then use get_documentation_page to retrieve the full content of the most relevant ones: ${JSON.stringify(allPages, null, 2)}`
            }
          }
        ]
      }
    }
  )

  server.registerPrompt(
    'deployment_guide',
    {
      title: 'Deployment Guide',
      description: 'Get deployment instructions for a specific hosting provider',
      argsSchema: {
        provider: z.string().describe('Hosting provider name (e.g., "Vercel", "Netlify", "AWS", "Cloudflare")')
      }
    },
    async ({ provider }: { provider: string }) => {
      const deployProviders = await $fetch('/api/mcp/list-deploy-providers')
      const matchingProvider = deployProviders.find(p =>
        p.title.toLowerCase().includes(provider.toLowerCase())
      )

      let providerDetails = null
      if (matchingProvider) {
        providerDetails = await $fetch('/api/mcp/get-deploy-provider', {
          query: { path: matchingProvider.path }
        })
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me deploy my Nuxt application to ${provider}. ${providerDetails ? `Here are the deployment instructions: ${JSON.stringify(providerDetails, null, 2)}` : `Here are all available providers: ${JSON.stringify(deployProviders, null, 2)}`}`
            }
          }
        ]
      }
    }
  )

  server.registerPrompt(
    'migration_help',
    {
      title: 'Migration Help',
      description: 'Get help with migrating between Nuxt versions',
      argsSchema: {
        fromVersion: z.string().describe('Current Nuxt version (e.g., "2", "3.x")'),
        toVersion: z.string().describe('Target Nuxt version (e.g., "3.x", "4.x")')
      }
    },
    async ({ fromVersion, toVersion }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me migrate my Nuxt application from version ${fromVersion} to ${toVersion}.

To find relevant migration guides, please:
1. Use list_documentation_pages to find pages related to migration from ${fromVersion} to ${toVersion}
2. Look for pages with "migration" in their title or description, or migration guides specific to version ${toVersion}
3. Use get_documentation_page to retrieve the full content of the most relevant migration guides
4. Provide step-by-step migration instructions based on the documentation found`
            }
          }
        ]
      }
    }
  )

  // TOOLS

  server.registerTool(
    'list_documentation_pages',
    {
      title: 'List Documentation Pages',
      description: 'Lists all available Nuxt documentation pages with their categories and basic information. Use this tool to find relevant pages by examining titles and descriptions, then use get_documentation_page to retrieve full content.',
      inputSchema: {
        version: z.enum(['3.x', '4.x', 'all']).optional().default('4.x').describe('Documentation version to fetch')
      }
    },
    async (params: { version?: '3.x' | '4.x' | 'all' }) => {
      const result = await $fetch('/api/mcp/list-documentation-pages', { query: params })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_documentation_page',
    {
      title: 'Get Documentation Page',
      description: 'Retrieves Nuxt documentation page content and details. Parameters: path (string, required) - the documentation path starting with /docs/.',
      inputSchema: {
        path: z.string().describe('The path to the documentation page (e.g., /docs/3.x/getting-started/introduction)')
      }
    },
    async (params: { path: string }) => {
      const result = await $fetch('/api/mcp/get-documentation-page', { query: params })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'list_blog_posts',
    {
      title: 'List Blog Posts',
      description: 'Lists all Nuxt blog posts with metadata including dates, categories, and tags.',
      inputSchema: {}
    },
    async () => {
      const result = await $fetch('/api/mcp/list-blog-posts')
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_blog_post',
    {
      title: 'Get Blog Post',
      description: 'Retrieves blog post content and details. Parameters: path (string, required) - the blog post path starting with /blog/.',
      inputSchema: {
        path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
      }
    },
    async (params: { path: string }) => {
      const result = await $fetch('/api/mcp/get-blog-post', { query: params })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'list_deploy_providers',
    {
      title: 'List Deploy Providers',
      description: 'Lists all deployment providers and hosting platforms for Nuxt applications.',
      inputSchema: {}
    },
    async () => {
      const result = await $fetch('/api/mcp/list-deploy-providers')
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_deploy_provider',
    {
      title: 'Get Deploy Provider',
      description: 'Retrieves deployment provider details and instructions. Parameters: path (string, required) - the deploy provider path starting with /deploy/.',
      inputSchema: {
        path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)')
      }
    },
    async (params: { path: string }) => {
      const result = await $fetch('/api/mcp/get-deploy-provider', { query: params })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_getting_started_guide',
    {
      title: 'Get Getting Started Guide',
      description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
      inputSchema: {
        version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version')
      }
    },
    async ({ version }: { version?: '3.x' | '4.x' }) => {
      const gettingStarted = await $fetch('/api/mcp/get-documentation-page', {
        query: { path: `/docs/${version}/getting-started/introduction` }
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(gettingStarted, null, 2) }]
      }
    }
  )

  server.registerTool(
    'list_modules',
    {
      title: 'List Modules',
      description: 'Lists all available Nuxt modules with optional filtering and sorting. Use this to search for modules by name, description, or category, and find the best module for your needs.',
      inputSchema: {
        search: z.string().optional().describe('Search term to filter modules by name, description, or npm package name'),
        category: z.string().optional().describe('Filter modules by category (e.g., "ui", "database", "auth", "seo")'),
        sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
        order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)')
      }
    },
    async (params: { search?: string, category?: string, sort?: 'downloads' | 'stars' | 'publishedAt' | 'createdAt', order?: 'asc' | 'desc' }) => {
      const result = await $fetch('/api/mcp/list-modules', { query: params })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_module',
    {
      title: 'Get Module',
      description: 'Retrieves detailed information about a specific Nuxt module by its slug/name. Use this after finding a module with list_modules to get complete details including maintainers, contributors, compatibility, and README.',
      inputSchema: {
        slug: z.string().describe('The module slug/name (e.g., "@nuxt/ui", "nuxt-auth", "nuxt-icon")')
      }
    },
    async (params: { slug: string }) => {
      const result = await $fetch('/api/mcp/get-module', { query: params })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  return server
}

export default defineEventHandler(async (event) => {
  if (getHeader(event, 'accept')?.includes('text/html')) {
    return sendRedirect(event, '/docs/guide/ai/mcp')
  }

  const server = createServer()

  const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  })

  event.node.res.on('close', () => {
    transport.close()
    server.close()
  })

  await server.connect(transport)

  const body = await readBody(event)

  await transport.handleRequest(event.node.req, event.node.res, body)
})
