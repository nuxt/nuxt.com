import { z } from 'zod'
import { getAgentDocument } from '#agent-discovery'
import { getVersionByPath, isArchivedDocVersion } from '#shared/utils/docs'

export default defineMcpTool({
  description: `Retrieves the full content of a Nuxt docs page by its path.

WHEN TO USE: When you know the EXACT path of a documentation page, for example one returned by search-documentation or list-documentation-pages, or one of the common pages below.
WHEN NOT TO USE: For a question or topic, use search-documentation first: it searches page content and returns the matching sections. Don't guess paths.

PATHS: Composables are /docs/4.x/api/composables/<kebab-name> (useFetch → use-fetch), utils /docs/4.x/api/utils/<kebab-name>, and the app/ directory /docs/4.x/directory-structure/app/<name>.

COMMON PAGES (Nuxt 4.x):
- "/docs/4.x/getting-started/introduction", "/docs/4.x/getting-started/installation"
- "/docs/4.x/getting-started/upgrade" - upgrade from Nuxt 3
- "/docs/4.x/getting-started/data-fetching", "/docs/4.x/api/composables/use-fetch", "/docs/4.x/api/composables/use-async-data"
- "/docs/4.x/getting-started/state-management", "/docs/4.x/getting-started/error-handling", "/docs/4.x/getting-started/seo-meta"
- "/docs/4.x/guide/concepts/rendering" - SSR, SSG, hybrid rendering and route rules
- "/docs/4.x/guide/going-further/runtime-config" - runtimeConfig and environment variables
- "/docs/4.x/guide/best-practices/hydration" - hydration mismatches
- "/docs/4.x/directory-structure/app/pages", "/docs/4.x/directory-structure/app/components", "/docs/4.x/directory-structure/app/composables", "/docs/4.x/directory-structure/app/middleware", "/docs/4.x/directory-structure/server"`,
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
    { path: '/docs/4.x/guide/directory-structure/components', sections: ['Usage'] }
  ],
  cache: '30m',
  async handler({ path, sections }) {
    const event = useEvent()

    // Resolved in-process by the same adapter `/raw/**.md` uses, so the tool
    // returns the bytes the URL does. A path naming a section resolves to its
    // first document, which is what following the raw route's redirect does.
    // `includeExcluded` because this tool deliberately serves the nightly
    // version that `excludePrefixes` keeps out of the public listings.
    let document = await getAgentDocument(event, path, { sections, includeExcluded: true })
    if (document && 'redirect' in document) {
      document = await getAgentDocument(event, document.redirect, { sections, includeExcluded: true })
    }

    const version = document && !('redirect' in document) ? getVersionByPath(new URL(document.canonicalUrl).pathname) : undefined

    const isArchived = version && isArchivedDocVersion(version)

    if (!document || 'redirect' in document || isArchived) {
      throw createError({ statusCode: 404, message: `Documentation page not found: ${path}. Use search-documentation to find pages by topic.` })
    }

    let content = document.markdown
    // Covers every API page (use-fetch is ~27k characters); only a few long guides go over
    const MAX_CHARS = 30_000
    if (content.length > MAX_CHARS) {
      content = content.slice(0, MAX_CHARS) + '\n\n[Content truncated. Use the sections parameter to request specific h2 sections.]'
    }

    return content
  }
})
