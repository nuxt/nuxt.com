import { z } from 'zod'
import { ALL_DOCS_SOURCES, DOCS_COLLECTION_SOURCES, type DocsCollection } from '#shared/utils/docs'

function collectionForVersion(version: '3.x' | '4.x' | '5.x'): DocsCollection {
  return version === '5.x' ? 'docsv5' : version === '3.x' ? 'docsv3' : 'docsv4'
}

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
    const sources = version === 'all'
      ? [...ALL_DOCS_SOURCES]
      : [...DOCS_COLLECTION_SOURCES[collectionForVersion(version)]]

    const docs = await content.list(sources)
    let allDocs = docs
      .filter(item => item.meta.extension === '.md' && !item.meta.stem.split('/').pop()?.startsWith('.'))
      .map(item => ({
        title: item.data.title ?? item.path,
        path: item.path,
        description: item.data.description ?? ''
      }))

    if (!allDocs.length) {
      throw createError({ statusCode: 404, message: 'Documentation pages collection not found' })
    }

    if (search) {
      const terms = search.toLowerCase().split(/\s+/)
      allDocs = allDocs.filter((doc) => {
        const haystack = `${doc.title} ${doc.path} ${doc.description}`.toLowerCase()
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
