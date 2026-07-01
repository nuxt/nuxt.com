import { z } from 'zod'

export default defineMcpTool({
  description: `Retrieves the full content and details of a specific Nuxt documentation page.

WHEN TO USE: Use this tool when you know the EXACT path to a documentation page. Common use cases:
- User asks for a specific page: "Show me the introduction page" → /docs/4.x/getting-started/introduction
- You found a relevant path from list_documentation_pages and want the full content

WHEN NOT TO USE: If you don't know the exact path and need to search/explore, use list_documentation_pages first (always pass a search term).

COMMON PAGES (Nuxt 4.x):
Getting Started:
- "/docs/4.x/getting-started/introduction" - main intro
- "/docs/4.x/getting-started/installation" - setup
- "/docs/4.x/getting-started/upgrade" - migration from v3
- "/docs/4.x/getting-started/error-handling" - error handling

Core Concepts:
- "/docs/4.x/guide/concepts/rendering" - SSR/CSR/SSG modes
- "/docs/4.x/guide/concepts/auto-imports" - auto-imports
- "/docs/4.x/guide/concepts/server-engine" - server features

Directory Structure (Nuxt 4 — app dirs live under directory-structure/app/):
- "/docs/4.x/directory-structure" - overview
- "/docs/4.x/directory-structure/app/composables" - composables
- "/docs/4.x/directory-structure/app/components" - components
- "/docs/4.x/directory-structure/app/pages" - routing
- "/docs/4.x/directory-structure/app/middleware" - route middleware
- "/docs/4.x/directory-structure/app/plugins" - plugins
- "/docs/4.x/directory-structure/app/layouts" - layouts
- "/docs/4.x/directory-structure/app/utils" - auto-imported utils
- "/docs/4.x/directory-structure/server" - server directory

Debugging:
- "/docs/4.x/guide/going-further/debugging" - debugging`,
  inputSchema: {
    path: z.string().describe('The path to the documentation page (e.g., /docs/4.x/getting-started/introduction)'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return (e.g., ["Usage", "API"]). If omitted, returns full documentation.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { path: '/docs/4.x/getting-started/introduction' },
    { path: '/docs/4.x/directory-structure/app/components', sections: ['Usage'] },
    { path: '/docs/4.x/directory-structure' }
  ],
  cache: '30m',
  async handler({ path, sections }) {
    const event = useEvent()
    const docsVersion = path.includes('/docs/5.x') ? 'docsv5' : path.includes('/docs/4.x') ? 'docsv4' : 'docsv3'
    const fullContent = await fetchPageMarkdown(event, docsVersion, path)

    if (!fullContent) {
      throw createError({ statusCode: 404, message: `Documentation page not found: ${path}` })
    }

    let content = sections?.length
      ? extractSections(fullContent, sections)
      : fullContent

    const MAX_CHARS = 12_000
    if (content.length > MAX_CHARS) {
      content = content.slice(0, MAX_CHARS) + '\n\n[Content truncated. Use the sections parameter to request specific h2 sections.]'
    }

    return content
  }
})
