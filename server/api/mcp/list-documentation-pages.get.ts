import { queryCollection } from '@nuxt/content/server'
import { z } from 'zod'

const querySchema = z.object({
  version: z.enum(['3.x', '4.x', 'all']).optional().default('4.x').describe('Documentation version to fetch')
})

export default defineCachedEventHandler(async (event) => {
  const { version } = await getValidatedQuery(event, querySchema.parse)

  let allDocs = []

  if (version === '3.x') {
    allDocs = await queryCollection(event, 'docsv3')
      .select('title', 'path', 'description')
      .all()
  } else if (version === '4.x') {
    allDocs = await queryCollection(event, 'docsv4')
      .select('title', 'path', 'description')
      .all()
  } else {
    const docsV3 = await queryCollection(event, 'docsv3')
      .select('title', 'path', 'description')
      .all()

    const docsV4 = await queryCollection(event, 'docsv4')
      .select('title', 'path', 'description')
      .all()

    allDocs = [...docsV3, ...docsV4]
  }

  return allDocs.map(doc => ({
    title: doc.title,
    path: doc.path,
    description: doc.description,
    version: doc.path.includes('/docs/4.x') ? '4.x' : '3.x',
    url: `https://nuxt.com${doc.path}`
  }))
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-documentation-pages-${query.version || '4.x'}`
  }
})
