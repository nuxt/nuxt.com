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
    const blogPosts = await listChildren('/blog')

    return blogPosts.map(post => ({
      title: post.data.title,
      path: post.path,
      description: post.data.description,
      date: post.data.date,
      category: post.data.category,
      authors: post.data.authors,
      image: post.data.image,
      url: `https://nuxt.com${post.path}`
    }))
  }
})
