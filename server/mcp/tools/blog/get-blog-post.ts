import { z } from 'zod'

export default defineMcpTool({
  description: `Retrieves the full content of a specific Nuxt blog post.

WHEN TO USE: Use this tool when you know the EXACT path to a blog post. Common scenarios:
- User asks for a specific post: "Get the blog post about Nuxt 4" → /blog/v4
- You found a relevant post from list_blog_posts and want the full content
- The current page context is a /blog/... path

WHEN NOT TO USE: If you don't know the exact path and need to search/discover, use list_blog_posts first. Never call this tool twice for the same path — one call returns the full post.

EXAMPLES: "/blog/v4", "/blog/nuxt3", "/blog/nuxt-on-the-edge"`,
  inputSchema: {
    path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { path: '/blog/v4' },
    { path: '/blog/nuxt-on-the-edge' }
  ],
  cache: '1h',
  async handler({ path }) {
    const event = useEvent()
    const fullContent = await fetchPageMarkdown(event, 'blog', path)

    if (!fullContent) {
      throw createError({ statusCode: 404, message: `Blog post not found: ${path}` })
    }

    return fullContent
  }
})
