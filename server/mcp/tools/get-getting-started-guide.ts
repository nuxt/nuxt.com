import { z } from 'zod'

export default defineMcpTool({
  description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
  inputSchema: {
    version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version')
  },
  async handler({ version }) {
    const gettingStarted = await $fetch('/api/mcp/get-documentation-page', {
      query: { path: `/docs/${version}/getting-started/introduction` }
    })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(gettingStarted, null, 2) }]
    }
  }
})
