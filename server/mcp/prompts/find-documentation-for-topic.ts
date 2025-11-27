import { z } from 'zod/v3'

export default defineMcpPrompt({
  description: 'Find the best Nuxt documentation for a specific topic or feature',
  inputSchema: {
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    topic: z.string().describe('Describe what you want to learn about (e.g., "server-side rendering", "data fetching", "routing")'),
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    version: z.enum(['3.x', '4.x']).optional().describe('Documentation version to search (defaults to 4.x)')
  },
  async handler({ topic, version = '4.x' }: any) {
    const allPages = await $fetch('/api/mcp/list-documentation-pages', {
      query: { version }
    })
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me find the best Nuxt documentation for this topic: "${topic}". Here are all available documentation pages. Please identify the most relevant pages based on their titles and descriptions, then use get_documentation_page to retrieve the full content of the most relevant ones: ${JSON.stringify(allPages, null, 2)}`
          }
        }
      ]
    }
  }
})
