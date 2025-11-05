import { queryCollection } from '@nuxt/content/server'

export default defineCachedEventHandler(async (event) => {
  const blogPosts = await queryCollection(event, 'blog')
    .select('title', 'path', 'description', 'date', 'category', 'tags', 'authors', 'image')
    .all()

  if (!blogPosts) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Blog posts collection not found'
    })
  }

  return blogPosts.map(post => ({
    title: post.title,
    path: post.path,
    description: post.description,
    date: post.date,
    category: post.category,
    tags: post.tags,
    authors: post.authors,
    image: post.image,
    url: `https://nuxt.com${post.path}`
  }))
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: () => 'mcp-blog-posts'
})
