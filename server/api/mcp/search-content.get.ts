import type { BlogCollectionItem, DeployCollectionItem, Docsv3CollectionItem, Docsv4CollectionItem } from '@nuxt/content'
import { z } from 'zod'

const querySchema = z.object({
  query: z.string().describe('Search query'),
  type: z.enum(['docs', 'blog', 'deploy', 'all']).optional().default('all').describe('Content type to search'),
  version: z.enum(['3.x', '4.x', 'all']).optional().default('all').describe('Documentation version to search')
})

export default defineEventHandler(async (event) => {
  const { query: searchQuery, type, version } = await getValidatedQuery(event, querySchema.parse)

  const results = []

  try {
    // Search documentation
    if (type === 'docs' || type === 'all') {
      let docs: (Docsv3CollectionItem | Docsv4CollectionItem)[] = []

      if (version === '3.x') {
        docs = await queryCollection(event, 'docsv3')
          .where('title', 'LIKE', `%${searchQuery}%`)
          .select('title', 'path', 'description')
          .limit(20)
          .all()
      } else if (version === '4.x') {
        docs = await queryCollection(event, 'docsv4')
          .where('title', 'LIKE', `%${searchQuery}%`)
          .select('title', 'path', 'description')
          .limit(20)
          .all()
      } else {
        const docsV3 = await queryCollection(event, 'docsv3')
          .where('title', 'LIKE', `%${searchQuery}%`)
          .select('title', 'path', 'description')
          .limit(10)
          .all()
        const docsV4 = await queryCollection(event, 'docsv4')
          .where('title', 'LIKE', `%${searchQuery}%`)
          .select('title', 'path', 'description')
          .limit(10)
          .all()
        docs = [...docsV3, ...docsV4]
      }

      results.push(...docs.map((doc: Docsv3CollectionItem | Docsv4CollectionItem) => ({
        type: 'documentation',
        title: doc.title,
        path: doc.path,
        description: doc.description,
        version: doc.path.includes('/docs/4.x') ? '4.x' : '3.x',
        url: `https://nuxt.com${doc.path}`
      })))
    }

    // Search blog posts
    if (type === 'blog' || type === 'all') {
      const blog = await queryCollection(event, 'blog')
        .where('title', 'LIKE', `%${searchQuery}%`)
        .select('title', 'path', 'description', 'date', 'category', 'tags')
        .limit(10)
        .all()

      results.push(...blog.map((post: BlogCollectionItem) => ({
        type: 'blog',
        title: post.title,
        path: post.path,
        description: post.description,
        date: post.date,
        category: post.category,
        tags: post.tags,
        url: `https://nuxt.com${post.path}`
      })))
    }

    // Search deploy providers
    if (type === 'deploy' || type === 'all') {
      const deploy = await queryCollection(event, 'deploy')
        .where('title', 'LIKE', `%${searchQuery}%`)
        .select('title', 'path', 'description', 'category', 'nitroPreset')
        .limit(10)
        .all()

      results.push(...deploy.map((provider: DeployCollectionItem) => ({
        type: 'deploy',
        title: provider.title,
        path: provider.path,
        description: provider.description,
        category: provider.category,
        nitroPreset: provider.nitroPreset,
        url: `https://nuxt.com${provider.path}`
      })))
    }

    return {
      query: searchQuery,
      results,
      total: results.length,
      filters: {
        type,
        version
      }
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})
