import { z } from 'zod'

export default defineMcpTool({
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
    path: z.string().describe('The path to the documentation page (e.g., /docs/4.x/getting-started/introduction)'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return (e.g., ["Usage", "API"]). If omitted, returns full documentation.')
  },
  cache: '30m',
  async handler({ path, sections }) {
    try {
      const fullContent = await $fetch<string>(`/raw${path}.md`)

      let content = fullContent
      if (sections?.length) {
        content = extractSections(fullContent, sections)
      }

      return {
        content: [{ type: 'text' as const, text: content }]
      }
    } catch (error) {
      return errorResult(`Documentation page not found: ${error}`)
    }
  }
})
