import { z } from 'zod'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import { DOC_VERSIONS, type DocVersion } from '#shared/utils/docs'

export default defineMcpTool({
  description: `Lists Nuxt documentation pages, optionally filtered by search term.

WHEN TO USE: When you need to find documentation about a topic but don't know the exact page path.
WHEN NOT TO USE: If you already know the page path, use get_documentation_page directly.
TIPS: Always pass a search term to narrow results — avoids dumping the entire catalog.`,
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
    let allDocs: { title: string, path: string, description: string }[] = []

    const versions: DocVersion[] = version === 'all' ? [...DOC_VERSIONS] : [version as DocVersion]

    for (const docsVersion of versions) {
      const docs = await listInstancePages(docsInstanceKey(docsVersion))
      if (!docs.length) {
        if (version === 'all') continue
        throw createError({ statusCode: 404, message: 'Documentation pages collection not found' })
      }
      allDocs.push(...docs)
      allDocs.push(...await listInstancePages(cliInstanceKey(docsVersion)).catch(() => []))
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
      url: `https://nuxt.com${doc.path}`
    }))
  }
})
