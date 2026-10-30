import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import type { BlogArticle } from '#shared/types'
import { blogAuthors } from '#shared/utils/blog'

const getResult = defineCachedFunction(async (_event: H3Event) => {
  const blogPosts = (await listByDir<BlogArticle>('/blog')).filter(post => post.extension === '.md' && post.path !== '/blog')

  if (!blogPosts.length) {
    throw createError({ statusCode: 404, message: 'Blog posts collection not found' })
  }

  return blogPosts.map(post => ({
    title: post.title,
    path: post.path,
    description: post.description,
    date: post.date,
    category: post.category,
    tags: post.tags,
    // GitHub usernames: get-nuxter / show_nuxter take them
    authors: blogAuthors(post.authors).map(({ name, username }) => ({ name, username })),
    image: post.image,
    url: `https://nuxt.com${post.path}`
  }))
}, {
  name: 'mcp-list-blog-posts',
  maxAge: 3600,
  swr: false,
  getKey: event => hash([getRequestURL(event).origin])
})

export default defineMcpTool({
  description: `Lists all Nuxt blog posts with metadata including titles, dates, categories, tags, and descriptions.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for blog posts. Common scenarios:
- "What are the latest announcements?" - browse recent posts
- "Has there been any post about X feature?" - search by topic
- "Show me performance improvements" - find relevant posts by topic
- "What's new in Nuxt?" - explore recent updates

WHEN NOT TO USE: If you already know the exact blog post path (e.g., "/blog/v4"), use get-blog-post directly.

OUTPUT: Returns list of posts with title, description, date, path. Use get-blog-post to retrieve full content of specific posts.`,
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: () => getResult(useEvent())
})
