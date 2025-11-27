import { z } from 'zod'

export default defineMcpTool({
  description: `Lists all available Nuxt documentation pages with their categories and basic information.

WHEN TO USE: Use this tool when you need to EXPLORE or SEARCH for documentation about a topic but don't know the exact page path. For example: "Find documentation about hydration errors", "What pages cover rendering modes?", "Search for migration guides".

WHEN NOT TO USE: If you already know the specific page path (e.g., "/docs/4.x/getting-started/introduction"), use get_documentation_page directly instead.

WORKFLOW: This tool returns page titles, descriptions, and paths. After finding relevant pages, use get_documentation_page to retrieve the full content.`,
  inputSchema: {
    version: z.enum(['3.x', '4.x', 'all']).optional().default('4.x').describe('Documentation version to fetch')
  },
  async handler({ version }) {
    const result = await $fetch('/api/mcp/list-documentation-pages', { query: { version } })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
