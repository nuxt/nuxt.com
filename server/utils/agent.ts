import { getRequestHeader, setHeader, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'

/**
 * Negotiate the representation a request wants.
 *
 * Might be overridable by https://github.com/benjamincanac/nuxt-agent-discovery in the future.
 */

/** Cap on echoed values: the path is attacker-controlled and an agent reads the body. */
const MAX_ECHO_LENGTH = 200

/** Compared after dropping the `: /path` suffix Nitro appends in development. */
const GENERIC_MESSAGES = new Set(['', 'not found', 'page not found'])

function accepts(event: H3Event, type: string): boolean {
  const header = getRequestHeader(event, 'accept')
  return !!header && header.toLowerCase().includes(type)
}

function readHeader(event: H3Event, name: string): string {
  return (getRequestHeader(event, name) || '').toLowerCase()
}

function pathname(event: H3Event): string {
  return (event.path || '/').split('?')[0] || '/'
}

/** Browsers keep the themed error page. */
export function wantsHtml(event: H3Event): boolean {
  return accepts(event, 'text/html')
}

/** API clients keep the default JSON body. */
export function wantsJson(event: H3Event): boolean {
  if (accepts(event, 'application/json')) return true
  if (readHeader(event, 'sec-fetch-mode') === 'cors' && readHeader(event, 'sec-fetch-dest') === 'empty') {
    return true
  }

  const path = pathname(event)
  return path.startsWith('/api/') || path.endsWith('.json')
}

/**
 * Only page-ish requests get a document: a missing script, image or feed is consumed by code, where
 * markdown would be nonsense. `.md` stays in — a raw markdown URL is exactly what an agent asks for.
 */
export function wantsAsset(event: H3Event): boolean {
  const extension = pathname(event).split('/').pop()?.match(/\.([a-z0-9]+)$/i)?.[1]
  return !!extension && !['md', 'html', 'htm'].includes(extension.toLowerCase())
}

/** Drop what would break out of the surrounding code span, then cap the length. */
function escapeEcho(value: string): string {
  let cleaned = ''
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x20 || code === 0x7F || char === '`') continue
    cleaned += char
  }
  cleaned = cleaned.trim()
  return cleaned.length > MAX_ECHO_LENGTH ? `${cleaned.slice(0, MAX_ECHO_LENGTH)}…` : cleaned
}

/** A route's own 404 message ("No article with that slug") says more than the path missing. */
export function specificMessage(message?: string): string | undefined {
  const value = escapeEcho(message || '')
  if (!value) return undefined
  const normalized = value.toLowerCase().replace(/:.*$/, '').trim()
  return GENERIC_MESSAGES.has(normalized) ? undefined : value
}

/** Machine-readable entry points nuxt.com actually serves. */
const RECOVERY_LINKS: Array<{ path: string, description: string }> = [
  { path: '/llms.txt', description: 'index of every documentation page, with raw markdown links' },
  { path: '/llms-full.txt', description: 'the full documentation as a single markdown file' },
  { path: '/raw/index.md', description: 'the landing page as markdown' },
  { path: '/sitemap.xml', description: 'every page, with its last modification date' },
  { path: '/.well-known/mcp/server-card.json', description: 'the MCP server exposing docs tools' },
  { path: '/', description: 'home page' }
]

export function buildNotFoundMarkdown(options: { path: string, message?: string }): string {
  const lines = [
    '# 404 — Page not found',
    '',
    `\`${escapeEcho(options.path)}\` was not found on this site.`
  ]

  const message = specificMessage(options.message)
  if (message) {
    lines.push('', `> ${message}`)
  }

  lines.push('', '## Where to look next', '')
  for (const link of RECOVERY_LINKS) {
    lines.push(`- [${link.path}](${link.path}): ${link.description}`)
  }
  lines.push('', 'Every documentation page is mirrored as raw markdown at `/raw/<path>.md`.', '')

  return lines.join('\n')
}

/** Send the markdown 404 for `path`, with the headers agents and CDNs need. */
export function notFoundMarkdown(event: H3Event, path?: string, message?: string): string {
  setResponseStatus(event, 404, 'Page not found')
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Vary', 'Accept, User-Agent')

  return buildNotFoundMarkdown({ path: path ?? pathname(event), message })
}
