import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { DeployCollectionItem } from '@nuxt/content'

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
        topic: z.string().describe('Describe what you want to learn about (e.g., "server-side rendering", "data fetching", "routing")')
      }
    },
    async ({ topic }) => {
      const searchResults = await $fetch('/api/mcp/search-content', {
        query: { query: topic, type: 'docs' }
      })
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me find the best Nuxt documentation for this topic: "${topic}". Here are the search results: ${JSON.stringify(searchResults, null, 2)}`
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
    async ({ provider }) => {
      const deployProviders = await $fetch('/api/mcp/list-deploy-providers')
      const matchingProvider = deployProviders.find((p: DeployCollectionItem) =>
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
      const migrationDocs = await $fetch('/api/mcp/search-content', {
        query: { query: `migration ${fromVersion} ${toVersion}`, type: 'docs' }
      })
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me migrate my Nuxt application from version ${fromVersion} to ${toVersion}. Here are relevant migration guides: ${JSON.stringify(migrationDocs, null, 2)}`
            }
          }
        ]
      }
    }
  )

  // TOOLS

  server.tool(
    'list_documentation_pages',
    'Lists all available Nuxt documentation pages with their categories and basic information. Returns: A JSON array of objects containing title, path, description, version, and url.',
    {
      version: z.enum(['3.x', '4.x', 'all']).optional().default('4.x').describe('Documentation version to fetch')
    },
    async (params) => {
      const result = await $fetch('/api/mcp/list-documentation-pages', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_documentation_page',
    'Retrieves Nuxt documentation page content and details. Parameters: path (string, required) - the documentation path starting with /docs/. Returns: A JSON object containing title, content, path, url, version, and links.',
    {
      path: z.string().describe('The path to the documentation page (e.g., /docs/3.x/getting-started/introduction)')
    },
    async (params) => {
      const result = await $fetch('/api/mcp/get-documentation-page', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'list_blog_posts',
    'Lists all Nuxt blog posts with metadata including dates, categories, and tags. Returns: A JSON array of objects containing title, path, description, date, category, tags, authors, image, and url.',
    {},
    async () => {
      const result = await $fetch('/api/mcp/list-blog-posts')
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_blog_post',
    'Retrieves blog post content and details. Parameters: path (string, required) - the blog post path starting with /blog/. Returns: A JSON object containing title, content, path, url, date, category, tags, authors, and image.',
    {
      path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
    },
    async (params) => {
      const result = await $fetch('/api/mcp/get-blog-post', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'list_deploy_providers',
    'Lists all deployment providers and hosting platforms for Nuxt applications. Returns: A JSON array of objects containing title, name, path, description, logoSrc, logoIcon, category, nitroPreset, website, sponsor, and url.',
    {},
    async () => {
      const result = await $fetch('/api/mcp/list-deploy-providers')
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_deploy_provider',
    'Retrieves deployment provider details and instructions. Parameters: path (string, required) - the deploy provider path starting with /deploy/. Returns: A JSON object containing title, name, path, description, content, logoSrc, logoIcon, category, nitroPreset, website, sponsor, and url.',
    {
      path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)')
    },
    async (params) => {
      const result = await $fetch('/api/mcp/get-deploy-provider', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'search_content',
    'Searches across all Nuxt content including documentation, blog posts, and deployment guides. Parameters: query (string, required) - search query, type (enum, optional) - content type filter, version (enum, optional) - documentation version filter. Returns: A JSON object containing search results with type, title, path, description, and relevant metadata.',
    {
      query: z.string().describe('Search query'),
      type: z.enum(['docs', 'blog', 'deploy', 'all']).optional().describe('Content type to search'),
      version: z.enum(['3.x', '4.x', 'all']).optional().describe('Documentation version to search')
    },
    async (params) => {
      const result = await $fetch('/api/mcp/search-content', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_getting_started_guide',
    'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version. Returns: A JSON object containing getting started documentation.',
    {
      version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version')
    },
    async ({ version }) => {
      const gettingStarted = await $fetch('/api/mcp/get-documentation-page', {
        query: { path: `/docs/${version}/getting-started/introduction` }
      })
      return { content: [{ type: 'text', text: JSON.stringify(gettingStarted, null, 2) }] }
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
