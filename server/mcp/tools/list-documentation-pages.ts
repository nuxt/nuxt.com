import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: `Lists Nuxt documentation pages, optionally filtered by search term.

WHEN TO USE: When you need to find documentation about a topic but don't know the exact page path.
WHEN NOT TO USE: If you already know the page path, use get_documentation_page directly.
TIPS: Always pass a search term to narrow results — avoids dumping the entire catalog.`,
  inputSchema: {
    version: z.enum(['3.x', '4.x', '5.x', 'all']).optional().default('4.x').describe('Documentation version to fetch'),
    search: z.string().optional().describe('Filter pages by keyword (matches title, path, and description). Strongly recommended to avoid large results.')
  },
  cache: '1h',
  async handler({ version, search }) {
    const event = useEvent()
    let allDocs: { title: string, path: string, description: string }[] = []

    const collections = version === 'all'
      ? ['docsv3', 'docsv4', 'docsv5'] as const
      : [version === '3.x' ? 'docsv3' : version === '5.x' ? 'docsv5' : 'docsv4'] as const

    for (const col of collections) {
      const docs = await queryCollection(event, col)
        .select('title', 'path', 'description')
        .all()
      if (!docs) {
        if (version === 'all') continue
        return errorResult('Documentation pages collection not found')
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

    return jsonResult(allDocs.map(doc => ({
      title: doc.title,
      path: doc.path,
      ...(search ? { description: doc.description } : {}),
      url: `https://nuxt.com${doc.path}`
    })))
  }
})
