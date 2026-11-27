import { z } from 'zod'

const inputSchema = z.object({
  fromVersion: z.string().describe('Current Nuxt version (e.g., "2", "3.x")'),
  toVersion: z.string().describe('Target Nuxt version (e.g., "3.x", "4.x")')
})

export default defineMcpPrompt({
  description: 'Get help with migrating between Nuxt versions',
  inputSchema,
  async handler({ fromVersion, toVersion }) {
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me migrate my Nuxt application from version ${fromVersion} to ${toVersion}.

To find relevant migration guides, please:
1. Use list-documentation-pages to find pages related to migration from ${fromVersion} to ${toVersion}
2. Look for pages with "migration" in their title or description, or migration guides specific to version ${toVersion}
3. Use get-documentation-page to retrieve the full content of the most relevant migration guides
4. Provide step-by-step migration instructions based on the documentation found`
          }
        }
      ]
    }
  }
})
