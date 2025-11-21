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
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        topic: z.string().describe('Describe what you want to learn about (e.g., "server-side rendering", "data fetching", "routing")'),
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
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
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        provider: z.string().describe('Hosting provider name (e.g., "Vercel", "Netlify", "AWS", "Cloudflare")')
      }
    },
    async ({ provider }: { provider: string }) => {
      const deployProviders = await $fetch('/api/mcp/list-deploy-providers')
      const matchingProvider = deployProviders.find(p =>
        p.title.toLowerCase().includes(provider!.toLowerCase())
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
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        fromVersion: z.string().describe('Current Nuxt version (e.g., "2", "3.x")'),
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
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
      description: `Lists all available Nuxt documentation pages with their categories and basic information.

WHEN TO USE: Use this tool when you need to EXPLORE or SEARCH for documentation about a topic but don't know the exact page path. For example: "Find documentation about hydration errors", "What pages cover rendering modes?", "Search for migration guides".

WHEN NOT TO USE: If you already know the specific page path (e.g., "/docs/4.x/getting-started/introduction"), use get_documentation_page directly instead.

WORKFLOW: This tool returns page titles, descriptions, and paths. After finding relevant pages, use get_documentation_page to retrieve the full content.`,
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        version: z.enum(['3.x', '4.x', 'all']).optional().default('4.x').describe('Documentation version to fetch')
      }
    },
    async (params: any) => {
      const result = await $fetch('/api/mcp/list-documentation-pages', { query: params })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_documentation_page',
    {
      title: 'Get Documentation Page',
      description: `Retrieves the full content and details of a specific Nuxt documentation page.

WHEN TO USE: Use this tool when you know the EXACT path to a documentation page. Common use cases:
- User asks for a specific page: "Show me the introduction page" → /docs/4.x/getting-started/introduction
- User asks about a known topic with a dedicated page
- You found a relevant path from list_documentation_pages and want the full content

WHEN NOT TO USE: If you don't know the exact path and need to search/explore, use list_documentation_pages first.

COMMON PAGES (Nuxt 4.x):
Getting Started:
- "/docs/4.x/getting-started/introduction" - main intro
- "/docs/4.x/getting-started/installation" - setup
- "/docs/4.x/getting-started/upgrade" - migration from v3

Core Concepts:
- "/docs/4.x/guide/concepts/rendering" - SSR/CSR/SSG modes
- "/docs/4.x/guide/concepts/auto-imports" - auto-imports
- "/docs/4.x/guide/concepts/server-engine" - server features

Directory Structure:
- "/docs/4.x/guide/directory-structure/composables" - composables
- "/docs/4.x/guide/directory-structure/components" - components
- "/docs/4.x/guide/directory-structure/pages" - routing

Common Issues:
- "/docs/4.x/guide/going-further/debugging" - debugging
- "/docs/4.x/guide/going-further/error-handling" - errors`,
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        path: z.string().describe('The path to the documentation page (e.g., /docs/4.x/getting-started/introduction)')
      }
    },
    async (params: any) => {
      const result = await $fetch('/api/mcp/get-documentation-page', { query: params })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'list_blog_posts',
    {
      title: 'List Blog Posts',
      description: `Lists all Nuxt blog posts with metadata including titles, dates, categories, tags, and descriptions.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for blog posts. Common scenarios:
- "What are the latest announcements?" - browse recent posts
- "Has there been any post about X feature?" - search by topic
- "Show me performance improvements" - find relevant posts by topic
- "What's new in Nuxt?" - explore recent updates

WHEN NOT TO USE: If you already know the exact blog post path (e.g., "/blog/v4"), use get_blog_post directly.

OUTPUT: Returns list of posts with title, description, date, path. Use get_blog_post to retrieve full content of specific posts.`
    },
    async (_args: any, _extra: any) => {
      const result = await $fetch('/api/mcp/list-blog-posts')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_blog_post',
    {
      title: 'Get Blog Post',
      description: `Retrieves the full content and details of a specific Nuxt blog post.

WHEN TO USE: Use this tool when you know the EXACT path to a blog post. Common scenarios:
- User asks for a specific post: "Get the blog post about Nuxt 4" → /blog/v4
- You found a relevant post from list_blog_posts and want the full content
- You know the post slug from context

WHEN NOT TO USE: If you don't know the exact path and need to search/discover, use list_blog_posts first.

EXAMPLES: "/blog/v4", "/blog/nuxt3", "/blog/nuxt-on-the-edge"`,
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
      }
    },
    async (params: any) => {
      const result = await $fetch('/api/mcp/get-blog-post', { query: params })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'list_deploy_providers',
    {
      title: 'List Deploy Providers',
      description: `Lists all deployment providers and hosting platforms for Nuxt applications with their features and capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or COMPARE deployment options. Common scenarios:
- "What deployment platforms are available?" - browse all options
- "I need edge functions support" - compare features across providers
- "Show me platforms with free tiers" - search for specific features
- "What are my deployment options?" - general exploration

WHEN NOT TO USE: If you know the exact provider (e.g., "Vercel", "Cloudflare"), you can use get_deploy_provider directly with the path.

OUTPUT: Returns list of providers with titles, descriptions, and paths. Use get_deploy_provider for detailed deployment instructions.`
    },
    async (_args: any, _extra: any) => {
      const result = await $fetch('/api/mcp/list-deploy-providers')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_deploy_provider',
    {
      title: 'Get Deploy Provider',
      description: `Retrieves detailed deployment instructions and setup guide for a specific hosting provider.

WHEN TO USE: Use this tool when you know EXACTLY which provider the user wants. Common scenarios:
- User asks for a specific provider: "How do I deploy to Vercel?" → /deploy/vercel
- User mentions a known platform: "Cloudflare deployment" → /deploy/cloudflare
- You found a relevant provider from list_deploy_providers and want full details

WHEN NOT TO USE: If the user is asking about options or comparing providers, use list_deploy_providers first.

EXAMPLES: "/deploy/vercel", "/deploy/cloudflare", "/deploy/netlify", "/deploy/aws", "/deploy/node-server"`,
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)')
      }
    },
    async (params: any) => {
      const result = await $fetch('/api/mcp/get-deploy-provider', { query: params })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_getting_started_guide',
    {
      title: 'Get Getting Started Guide',
      description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version')
      }
    },
    async ({ version }: any) => {
      const gettingStarted = await $fetch('/api/mcp/get-documentation-page', {
        query: { path: `/docs/${version}/getting-started/introduction` }
      })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(gettingStarted, null, 2) }]
      }
    }
  )

  server.registerTool(
    'list_modules',
    {
      title: 'List Modules',
      description: `Lists all available Nuxt modules with optional filtering and sorting capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for modules. Common scenarios:
- "I need an authentication module" - search by category or keyword
- "What UI libraries are available?" - filter by category
- "Show me popular image optimization modules" - filter + sort by downloads
- "Find a module for X feature" - general exploration

PARAMETERS:
- search: Filter by name, description, or npm package name
- category: Filter by category (e.g., "ui", "auth", "database", "media", "seo")
- sort: Order by downloads, stars, publishedAt, or createdAt
- order: asc or desc

WHEN NOT TO USE: If you already know the exact module slug (e.g., "@nuxt/ui"), use get_module directly.

OUTPUT: Returns list of modules with name, description, category, stats. Use get_module for complete details including README and compatibility.`,
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        search: z.string().optional().describe('Search term to filter modules by name, description, or npm package name'),
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        category: z.string().optional().describe('Filter modules by category (e.g., "ui", "database", "auth", "seo")'),
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)')
      }
    },
    async (params: any) => {
      const result = await $fetch('/api/mcp/list-modules', { query: params })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    }
  )

  server.registerTool(
    'get_module',
    {
      title: 'Get Module',
      description: `Retrieves complete details about a specific Nuxt module including README, compatibility, maintainers, and stats.

WHEN TO USE: Use this tool when you know the EXACT module identifier. Common scenarios:
- User asks for a specific module: "Get details about @nuxt/ui"
- User mentions a known module: "Show me nuxt-icon module"
- You found a relevant module from list_modules and want full details
- You need to check Nuxt 4 compatibility for a specific module

WHEN NOT TO USE: If you don't know the exact module identifier and need to search/discover modules, use list_modules first.

PARAMETER: slug (required) - The unique module identifier
EXAMPLES:
- slug: "@nuxt/ui"
- slug: "@nuxtjs/i18n"
- slug: "nuxt-icon"
- slug: "@nuxt/image"
- slug: "nuxt-auth"`,
      inputSchema: {
        // @ts-expect-error - MCP SDK has overly strict Zod type constraints
        slug: z.string().describe('The unique module identifier, exactly as shown in list_modules (e.g., "@nuxt/ui", "@nuxtjs/i18n", "nuxt-icon")')
      }
    },
    async (params: any) => {
      const result = await $fetch('/api/mcp/get-module', { query: params })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
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
