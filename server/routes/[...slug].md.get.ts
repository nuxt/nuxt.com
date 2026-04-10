import { generateNotFoundMarkdown } from '@vercel/agent-readability'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  const path = `/${slug}`

  try {
    const md = await $fetch<string>(`/raw${path}.md`)
    setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setResponseHeader(event, 'Vary', 'Accept, User-Agent')
    return md
  }
  catch {
    const notFound = generateNotFoundMarkdown(path, {
      baseUrl: 'https://nuxt.com',
      sitemapUrl: '/sitemap.md',
      indexUrl: '/llms.txt',
      fullContentUrl: '/llms-full.txt',
      exampleUrl: '/docs/4.x/getting-started/introduction.md'
    })
    setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    return notFound
  }
})
