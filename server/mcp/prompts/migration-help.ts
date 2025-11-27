import { z } from 'zod/v3'

export default defineMcpPrompt({
  description: 'Get help with migrating between Nuxt versions',
  inputSchema: {
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    fromVersion: z.string().describe('Current Nuxt version (e.g., "2", "3.x")'),
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    toVersion: z.string().describe('Target Nuxt version (e.g., "3.x", "4.x")')
  },
  async handler({ fromVersion, toVersion }: any) {
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
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
})
