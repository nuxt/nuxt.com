import { z } from 'zod/v3'

export default defineMcpTool({
  description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
  inputSchema: {
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version')
  },
  async handler({ version }: any) {
    const gettingStarted = await $fetch('/api/mcp/get-documentation-page', {
      query: { path: `/docs/${version}/getting-started/introduction` }
    })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(gettingStarted, null, 2) }]
    }
  }
})
