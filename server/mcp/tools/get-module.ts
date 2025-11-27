import { z } from 'zod'

export default defineMcpTool({
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
    slug: z.string().describe('The unique module identifier, exactly as shown in list_modules (e.g., "@nuxt/ui", "@nuxtjs/i18n", "nuxt-icon")')
  },
  async handler({ slug }) {
    const result = await $fetch('/api/mcp/get-module', { query: { slug } })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
