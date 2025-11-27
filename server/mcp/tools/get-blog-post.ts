import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: `Retrieves the full content and details of a specific Nuxt blog post.

WHEN TO USE: Use this tool when you know the EXACT path to a blog post. Common scenarios:
- User asks for a specific post: "Get the blog post about Nuxt 4" → /blog/v4
- You found a relevant post from list_blog_posts and want the full content
- You know the post slug from context

WHEN NOT TO USE: If you don't know the exact path and need to search/discover, use list_blog_posts first.

EXAMPLES: "/blog/v4", "/blog/nuxt3", "/blog/nuxt-on-the-edge"`,
  inputSchema: {
    path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
  },
  cache: '1h',
  async handler({ path }) {
    const event = useEvent()

    const post = await queryCollection(event, 'blog')
      .where('path', '=', path)
      .select('title', 'path', 'description', 'body', 'date', 'category', 'tags', 'authors', 'image')
      .first()

    if (!post) {
      return errorResult('Blog post not found')
    }

    return jsonResult({
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
    })
  }
})
