import type { BlogCollectionItem } from '@nuxt/content'

export default defineCachedEventHandler(async (event) => {
  const blogPosts = await queryCollection(event, 'blog')
    .select('title', 'path', 'description', 'date', 'category', 'tags', 'authors', 'image')
    .all()

  return blogPosts.map((post: BlogCollectionItem) => ({
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
  maxAge: 60 * 30, // 30 minutes
  getKey: () => 'mcp-blog-posts'
})
