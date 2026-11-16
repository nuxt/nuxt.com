import { z } from 'zod'

/** nuxt.com and its subdomains: the only hosts this tool fetches, so an admin token cannot turn it into an open proxy. */
const NUXT_HOST = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*nuxt\.com$/
const MAX_REDIRECTS = 5
const MAX_HEAD_BYTES = 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000
const USER_AGENT = 'Mozilla/5.0 (compatible; NuxtAdminMCP/1.0; +https://nuxt.com)'

const HEAD_END = /<\/head\s*>/i
const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ' }

type Redirect = { from: string, status: number, to: string }

/** A path or URL as a URL on nuxt.com or a subdomain, or `undefined` for any other host, scheme, port or credentials. */
function toNuxtUrl(input: string): URL | undefined {
  if (!URL.canParse(input, 'https://nuxt.com')) return undefined
  const url = new URL(input, 'https://nuxt.com')
  const allowed = (url.protocol === 'https:' || url.protocol === 'http:') && !url.port && !url.username && !url.password && NUXT_HOST.test(url.hostname)
  return allowed ? url : undefined
}

function decodeEntities(value: string): string {
  return value.replace(/&(?:#x([0-9a-f]{1,6})|#(\d{1,7})|([a-z]+));/gi, (match, hex?: string, decimal?: string, name?: string) => {
    if (name) return NAMED_ENTITIES[name.toLowerCase()] ?? match
    const codePoint = hex ? Number.parseInt(hex, 16) : Number(decimal)
    return codePoint <= 0x10FFFF ? String.fromCodePoint(codePoint) : match
  })
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [, name, double, single, bare] of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[name!.toLowerCase()] = decodeEntities(double ?? single ?? bare ?? '').trim()
  }
  return result
}

/** The tags search engines build a result from. The first of each wins, as it does for a crawler. */
function parseHead(html: string) {
  const headEnd = html.search(HEAD_END)
  // Inline scripts and comments can quote tags that are not part of the document.
  const head = (headEnd === -1 ? html : html.slice(0, headEnd)).replace(/<(script|style)\b[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->/gi, '')

  const meta: Record<string, string> = {}
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const { name, property, content } = attributes(tag)
    const key = (name ?? property)?.toLowerCase()
    if (key && content !== undefined) meta[key] ??= content
  }

  const canonical = [...head.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => attributes(tag))
    .find(link => link.rel?.toLowerCase().split(/\s+/).includes('canonical'))

  const title = head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]

  return {
    title: title === undefined ? null : decodeEntities(title).replace(/\s+/g, ' ').trim(),
    description: meta.description ?? null,
    canonical: canonical?.href ?? null,
    robots: meta.robots ?? null
  }
}

/** Reads the response until `</head>`, so a page's megabyte of body and payload is never downloaded. */
async function readHead(response: Response): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let html = ''
  let bytes = 0
  while (bytes < MAX_HEAD_BYTES && !HEAD_END.test(html)) {
    const { done, value } = await reader.read()
    if (done) return html + decoder.decode()
    bytes += value.byteLength
    html += decoder.decode(value, { stream: true })
  }
  await reader.cancel()
  return html
}

async function fetchPage(url: URL): Promise<Response> {
  try {
    return await fetch(url, {
      // Each hop is checked against `NUXT_HOST` before it is fetched.
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, 'accept': 'text/html,application/xhtml+xml' }
    })
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError' ? `no response within ${FETCH_TIMEOUT_MS / 1000}s` : (error as { cause?: { code?: string } }).cause?.code ?? String(error)
    throw createError({ statusCode: 502, message: `Could not fetch ${url.href}: ${reason}. Retrying is safe.` })
  }
}

export default defineMcpTool({
  description: `Fetches one live page on nuxt.com or a subdomain (ui.nuxt.com, content.nuxt.com, devtools.nuxt.com, ...) and returns what a search engine reads first: the redirects it follows, the final HTTP status, and the page's \`<title>\`, meta description, canonical URL and robots directives.

WHEN TO USE: Read the current title and description before proposing new ones. Check whether a page or a whole host now redirects elsewhere: a moved page keeps losing clicks and impressions in \`search-console-analytics\` under its old URL while its new URL gains them. Confirm that a redirect lands on a page that exists.

NOTES: This is the live page; \`search-console-inspect-url\` gives Google's indexed copy and its chosen canonical. Redirects are followed for up to ${MAX_REDIRECTS} hops and only while they stay on nuxt.com hosts; \`redirects\` is empty when the URL answers directly. \`title\`, \`description\`, \`canonical\` and \`robots\` are \`null\` when the tag is absent or the final response is not a 2xx HTML page. It returns no page content.`,
  inputSchema: {
    url: z.string().describe('Full URL on nuxt.com or a subdomain (https://ui.nuxt.com/docs/components/button), or a nuxt.com path (/docs/4.x/getting-started/data-fetching).')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  inputExamples: [
    { url: '/docs/4.x/getting-started/data-fetching' },
    { url: 'https://ui.nuxt.com/docs/components/button' }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ url }) {
    const start = toNuxtUrl(url)
    if (!start) {
      throw createError({ statusCode: 400, message: `\`url\` must be a path or an http(s) URL on nuxt.com or one of its subdomains, without a port. Received: ${url}` })
    }

    const redirects: Redirect[] = []
    let current = start
    while (true) {
      const response = await fetchPage(current)
      const location = response.headers.get('location')
      const target = response.status >= 300 && response.status < 400 && location && URL.canParse(location, current) ? new URL(location, current) : undefined

      if (!target) {
        const isHtmlPage = response.ok && /^\s*(?:text\/html|application\/xhtml\+xml)\b/i.test(response.headers.get('content-type') ?? '')
        const head = isHtmlPage ? parseHead(await readHead(response)) : { title: null, description: null, canonical: null, robots: null }
        if (!isHtmlPage) await response.body?.cancel()
        return {
          url: start.href,
          redirects,
          finalUrl: current.href,
          status: response.status,
          ...head,
          xRobotsTag: response.headers.get('x-robots-tag')
        }
      }

      await response.body?.cancel()
      redirects.push({ from: current.href, status: response.status, to: target.href })
      const next = toNuxtUrl(target.href)
      if (!next || redirects.length >= MAX_REDIRECTS) {
        return {
          url: start.href,
          redirects,
          finalUrl: target.href,
          status: null,
          note: next ? `Stopped after ${MAX_REDIRECTS} redirects; ${target.href} was not fetched.` : `${target.href} is outside nuxt.com and was not fetched.`
        }
      }
      current = next
    }
  }
})
