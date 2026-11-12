import { z } from 'zod'
import { getAgentSiteUrl } from '#agent-discovery'
import { cliInstanceKey, docsInstanceKey, moduleBuilderInstanceKey } from '#shared/utils/content'
import type { CliDocVersion } from '#shared/utils/cli'
import { AGENT_DOC_VERSIONS } from '#shared/utils/docs'

export default defineMcpTool({
  description: `Lists Nuxt docs pages (title and path) for a version, optionally filtered by words in the title, path or description.

WHEN TO USE: To browse the docs catalog, or to list the pages of a section or another version (3.x, 5.x).
WHEN NOT TO USE: For a question or topic, use search-documentation, which searches page content. If you know the page path, use get-documentation-page.
TIPS: Always pass a search term to narrow results; every word must match.`,
  inputSchema: {
    version: z.enum(['3.x', '4.x', '5.x', 'all']).optional().default('4.x').describe('Documentation version to fetch'),
    search: z.string().optional().describe('Filter pages by keyword (matches title, path, and description). Strongly recommended to avoid large results.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { search: 'data fetching', version: '4.x' },
    { search: 'middleware' },
    { version: '3.x' }
  ],
  cache: '1h',
  async handler({ version, search }) {
    const event = useEvent()
    let allDocs: { title: string, path: string, description: string }[] = []

    const versions: CliDocVersion[] = version === 'all' ? [...AGENT_DOC_VERSIONS] : [version as CliDocVersion]

    for (const docsVersion of versions) {
      const docs = await listInstancePages(docsInstanceKey(docsVersion))
      if (!docs.length) {
        if (version === 'all') continue
        throw createError({ statusCode: 404, message: 'Documentation pages collection not found' })
      }
      allDocs.push(...docs)
      allDocs.push(...await listInstancePages(cliInstanceKey(docsVersion)).catch(() => []))
      allDocs.push(...await listInstancePages(moduleBuilderInstanceKey(docsVersion)).catch(() => []))
    }

    allDocs.push(...await listInstancePages('examples'))

    if (search) {
      const terms = search.toLowerCase().split(/\s+/)
      allDocs = allDocs.filter((doc) => {
        const haystack = `${doc.title ?? ''} ${doc.path ?? ''} ${doc.description ?? ''}`.toLowerCase()
        return terms.every(t => haystack.includes(t))
      })
    }

    return allDocs.map(doc => ({
      title: doc.title,
      path: doc.path,
      ...(search ? { description: doc.description } : {}),
      url: `${getAgentSiteUrl(event)}${doc.path}`
    }))
  }
})
