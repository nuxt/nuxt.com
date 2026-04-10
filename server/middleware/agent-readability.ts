import { shouldServeMarkdown, generateNotFoundMarkdown } from '@vercel/agent-readability'

const CONTENT_PREFIXES = ['/docs/', '/deploy/', '/blog/']

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  if (pathname.endsWith('.md') || pathname.startsWith('/raw/')) return
  if (pathname.startsWith('/api/') || pathname.startsWith('/_nuxt/') || pathname.startsWith('/__nuxt')) return

  const request = toWebRequest(event)
  const { serve, reason } = shouldServeMarkdown(request)
  if (!serve) return

  let mdRoute: string | null = null

  for (const prefix of CONTENT_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      mdRoute = `/raw${pathname}.md`
      break
    }
  }

  if (!mdRoute) {
    if (pathname === '/modules' || pathname === '/modules/') mdRoute = '/modules.md'
    else if (pathname === '/changelog' || pathname === '/changelog/') mdRoute = '/changelog.md'
  }

  if (!mdRoute) return

  try {
    const md = await $fetch<string>(mdRoute)
    setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setResponseHeader(event, 'Vary', 'Accept, User-Agent')
    setResponseHeader(event, 'X-Agent-Readability', reason)
    return md
  }
  catch {
    const notFound = generateNotFoundMarkdown(pathname, {
      baseUrl: 'https://nuxt.com',
      sitemapUrl: '/sitemap.md',
      indexUrl: '/llms.txt',
      fullContentUrl: '/llms-full.txt',
      exampleUrl: '/docs/4.x/getting-started/introduction.md'
    })
    setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setResponseHeader(event, 'Vary', 'Accept, User-Agent')
    setResponseHeader(event, 'X-Agent-Readability', `${reason}-not-found`)
    return notFound
  }
})
