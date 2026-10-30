import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { getAgentDocument } from '#agent-discovery'

const inputSchema = z.object({
  path: z.string().describe('The path to the blog post (e.g., /blog/v4)')
})

const getResult = defineCachedFunction(async (event: H3Event, { path }: z.output<typeof inputSchema>) => {
  const document = await getAgentDocument(event, path)

  if (!document || 'redirect' in document) {
    throw createError({ statusCode: 404, message: `Blog post not found: ${path}` })
  }

  return document.markdown
}, {
  name: 'mcp-get-blog-post',
  maxAge: 3600,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args])
})

export default defineMcpTool({
  description: `Retrieves the full content of a specific Nuxt blog post.

WHEN TO USE: Use this tool when you know the EXACT path to a blog post. Common scenarios:
- User asks for a specific post: "Get the blog post about Nuxt 4" → /blog/v4
- You found a relevant post from list-blog-posts and want the full content
- The current page context is a /blog/... path

WHEN NOT TO USE: If you don't know the exact path and need to search/discover, use list-blog-posts first. Never call this tool twice for the same path — one call returns the full post.

EXAMPLES: "/blog/v4", "/blog/nuxt3", "/blog/nuxt-on-the-edge"`,
  inputSchema: inputSchema.meta({ examples: [
    { path: '/blog/v4' },
    { path: '/blog/nuxt-on-the-edge' }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: args => getResult(useEvent(), args)
})
