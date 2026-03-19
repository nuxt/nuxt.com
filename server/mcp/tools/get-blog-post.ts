import { z } from 'zod'

export default defineMcpTool({
  description: `Retrieves the full content and details of a specific Nuxt blog post.

WHEN TO USE: Use this tool when you know the EXACT path to a blog post. Common scenarios:
- User asks for a specific post: "Get the blog post about Nuxt 4" → /blog/v4
- You found a relevant post from list_blog_posts and want the full content
- You know the post slug from context

WHEN NOT TO USE: If you don't know the exact path and need to search/discover, use list_blog_posts first.

EXAMPLES: "/blog/v4", "/blog/nuxt3", "/blog/nuxt-on-the-edge"`,
  inputSchema: {
    path: z.string().describe('The path to the blog post (e.g., /blog/v4)'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full content.')
  },
  cache: '1h',
  async handler({ path, sections }) {
    try {
      const fullContent = await $fetch<string>(`/raw${path}.md`)

      let content = fullContent
      if (sections?.length) {
        content = extractSections(fullContent, sections)
      }

      return {
        content: [{ type: 'text' as const, text: content }]
      }
    } catch (error) {
      return errorResult(`Blog post not found: ${error}`)
    }
  }
})
