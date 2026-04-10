import { shouldServeMarkdown, generateNotFoundMarkdown } from '@vercel/agent-readability'
import { trackMdRequest, extractTrackingContext, resolveSource } from '~~/server/utils/md-tracking'

const SKIP_PREFIXES = ['/api/', '/_nuxt/', '/__nuxt', '/raw/', '/agent-md/']

const NOT_FOUND_OPTIONS = {
  baseUrl: 'https://nuxt.com',
  sitemapUrl: '/sitemap.md',
  indexUrl: '/llms.txt',
  fullContentUrl: '/llms-full.txt',
  exampleUrl: '/docs/4.x/getting-started/introduction.md'
}

function respondMarkdown(event: Parameters<typeof setResponseHeader>[0], body: string, reason: string) {
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Vary', 'Accept, User-Agent')
  setResponseHeader(event, 'X-Agent-Readability', reason)
  return body
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  let pathname = url.pathname

  if (SKIP_PREFIXES.some(p => pathname.startsWith(p))) return
  if (/\.(?:js|css|ico|png|jpg|svg|woff2|json|xml|txt)$/.test(pathname)) return

  if (pathname.endsWith('.md')) {
    pathname = pathname.slice(0, -3)
  }

  const request = toWebRequest(event)
  const { serve, reason, detection } = shouldServeMarkdown(request)

  if (!serve && !url.pathname.endsWith('.md')) return

  const ctx = extractTrackingContext(event)
  const requestType = url.pathname.endsWith('.md')
    ? 'md-url' as const
    : reason === 'accept-header'
      ? 'header-negotiated' as const
      : 'agent-rewrite' as const

  const effectiveReason = reason || 'md-url'

  try {
    const md = await $fetch<string>(`/agent-md${pathname}`)
    trackMdRequest(event, { ...ctx, path: pathname, source: resolveSource(pathname), requestType, detectionMethod: detection.method })
    return respondMarkdown(event, md, effectiveReason)
  } catch {
    trackMdRequest(event, { ...ctx, path: pathname, source: 'agent-404', requestType, detectionMethod: detection.method })
    return respondMarkdown(event, generateNotFoundMarkdown(pathname, NOT_FOUND_OPTIONS), effectiveReason)
  }
})
