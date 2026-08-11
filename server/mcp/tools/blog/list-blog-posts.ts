export default defineMcpTool({
  description: `Lists all Nuxt blog posts with metadata including titles, dates, categories, and descriptions.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for blog posts. Common scenarios:
- "What are the latest announcements?" - browse recent posts
- "Has there been any post about X feature?" - search by topic
- "Show me performance improvements" - find relevant posts by topic
- "What's new in Nuxt?" - explore recent updates

WHEN NOT TO USE: If you already know the exact blog post path (e.g., "/blog/v4"), use get_blog_post directly.

OUTPUT: Returns list of posts with title, description, date, path. Use get_blog_post to retrieve full content of specific posts.`,
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  cache: '1h',
  async handler() {
    const items = await content.list(['local'])

    const blogPosts = items
      .filter(item => item.path.startsWith('/blog/') && item.path !== '/blog')
      .map(item => ({
        title: item.data.title,
        path: item.path,
        description: item.data.description,
        date: item.data.date,
        category: item.data.category,
        authors: item.data.authors,
        image: item.data.image,
        url: `https://nuxt.com${item.path}`
      }))

    if (!blogPosts.length) {
      throw createError({ statusCode: 404, message: 'Blog posts collection not found' })
    }

    return blogPosts
  }
})
