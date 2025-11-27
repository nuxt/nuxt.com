import { z } from 'zod/v3'

export default defineMcpTool({
  description: `Retrieves the full content and details of a specific Nuxt blog post.

WHEN TO USE: Use this tool when you know the EXACT path to a blog post. Common scenarios:
- User asks for a specific post: "Get the blog post about Nuxt 4" → /blog/v4
- You found a relevant post from list_blog_posts and want the full content
- You know the post slug from context

WHEN NOT TO USE: If you don't know the exact path and need to search/discover, use list_blog_posts first.

EXAMPLES: "/blog/v4", "/blog/nuxt3", "/blog/nuxt-on-the-edge"`,
  inputSchema: {
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
  },
  async handler(params: any) {
    const result = await $fetch('/api/mcp/get-blog-post', { query: params })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
