import { z } from 'zod'

export default defineMcpTool({
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
    search: z.string().optional().describe('Search term to filter modules by name, description, or npm package name'),
    category: z.string().optional().describe('Filter modules by category (e.g., "ui", "database", "auth", "seo")'),
    sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
    order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)')
  },
  async handler({ search, category, sort, order }) {
    const result = await $fetch('/api/mcp/list-modules', { query: { search, category, sort, order } })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
