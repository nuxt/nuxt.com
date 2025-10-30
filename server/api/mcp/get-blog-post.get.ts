import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

const querySchema = z.object({
  path: z.string().describe('The blog post path (e.g., /blog/v4)')
})

export default defineCachedEventHandler(async (event) => {
  const { path } = await getValidatedQuery(event, querySchema.parse)

  try {
    const post = await queryCollection(event, 'blog')
      .where('path', '=', path)
      .select('title', 'path', 'description', 'body', 'date', 'category', 'tags', 'authors', 'image')
      .first()

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Blog post not found'
      })
    }

    return {
      title: post.title,
      path: post.path,
      description: post.description,
      content: post.body,
      date: post.date,
      category: post.category,
      tags: post.tags,
      authors: post.authors,
      image: post.image,
      url: `https://nuxt.com${post.path}`
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch blog post'
    })
  }
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-blog-post-${query.path}`
  }
})
