import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: `Lists all Nuxt blog posts with metadata including titles, dates, categories, tags, and descriptions.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for blog posts. Common scenarios:
- "What are the latest announcements?" - browse recent posts
- "Has there been any post about X feature?" - search by topic
- "Show me performance improvements" - find relevant posts by topic
- "What's new in Nuxt?" - explore recent updates

WHEN NOT TO USE: If you already know the exact blog post path (e.g., "/blog/v4"), use get_blog_post directly.

OUTPUT: Returns list of posts with title, description, date, path. Use get_blog_post to retrieve full content of specific posts.`,
  cache: '1h',
  async handler() {
    const event = useEvent()

    const blogPosts = await queryCollection(event, 'blog')
      .select('title', 'path', 'description', 'date', 'category', 'tags', 'authors', 'image')
      .all()

    if (!blogPosts) {
      return errorResult('Blog posts collection not found')
    }

    return jsonResult(blogPosts.map(post => ({
      title: post.title,
      path: post.path,
      description: post.description,
      date: post.date,
      category: post.category,
      tags: post.tags,
      authors: post.authors,
      image: post.image,
      url: `https://nuxt.com${post.path}`
    })))
  }
})
