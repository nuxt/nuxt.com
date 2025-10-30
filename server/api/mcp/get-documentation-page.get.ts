import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

const querySchema = z.object({
  path: z.string().describe('The documentation path (e.g., /docs/3.x/getting-started/introduction)')
})

export default defineCachedEventHandler(async (event) => {
  const { path } = await getValidatedQuery(event, querySchema.parse)

  try {
    const docsVersion = path.includes('/docs/4.x') ? 'docsv4' : 'docsv3'

    const page = await queryCollection(event, docsVersion)
      .where('path', '=', path)
      .select('title', 'path', 'description', 'body', 'links')
      .first()

    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Documentation page not found'
      })
    }

    return {
      title: page.title,
      path: page.path,
      description: page.description,
      content: page.body,
      version: page.path.includes('/docs/4.x') ? '4.x' : '3.x',
      links: page.links,
      url: `https://nuxt.com${page.path}`
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch documentation page'
    })
  }
}, {
  maxAge: 60 * 30, // 30 minutes
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-documentation-page-${query.path}`
  }
})
