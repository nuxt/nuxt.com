import { z } from 'zod'
import { docsSourceGroups, docsSourcesFromCollection } from '#shared/utils/docs'

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
    const sourceGroups = version === 'all'
      ? [docsSourceGroups.docsv3, docsSourceGroups.docsv4, docsSourceGroups.docsv5]
      : [docsSourcesFromCollection(version === '3.x' ? 'docsv3' : version === '5.x' ? 'docsv5' : 'docsv4')]

    let allDocs: { title: string, path: string, description: string }[] = []

    for (const sources of sourceGroups) {
      // Explicit projection: docs groups mix docs (frontmatter) and examples (no frontmatter) sources.
      const items = await content.list<{ title?: string, description?: string }>([...sources])
      const docs = items.map(item => ({
        title: item.data.title || '',
        path: item.path,
        description: item.data.description || ''
      }))
      if (!docs.length) {
        if (version === 'all') continue
        throw createError({ statusCode: 404, message: 'Documentation pages collection not found' })
      }
      allDocs.push(...docs)
    }

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
