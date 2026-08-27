import { appendResponseHeader, send, setResponseHeader, setResponseStatus } from 'h3'
import type { NitroErrorHandler } from 'nitropack/types'

/**
 * Answer agent 404s with markdown pointing at nuxt.com's machine-readable entry points, instead of
 * Nitro's JSON error body.
 *
 * Might be overridable by https://github.com/benjamincanac/nuxt-agent-discovery in the future.
 */
const notFoundMarkdownHandler: NitroErrorHandler = async (error, event, { defaultHandler }) => {
  if (event.handled) return
  if ((error.statusCode || 500) !== 404) return
  if (wantsHtml(event) || wantsJson(event) || wantsAsset(event)) return

  // Let the default handler run first: a 302 means something already resolved this path.
  const fallback = await defaultHandler(error, event, { json: true })
  if (fallback.status === 302) return

  // Keep a route's own status text ("Module not found"), which beats "Not Found".
  setResponseStatus(event, 404, error.statusMessage || 'Not Found')
  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-cache')
  setResponseHeader(event, 'x-content-type-options', 'nosniff')
  // Appended, not set: the route may already vary on `User-Agent` for markdown negotiation.
  appendResponseHeader(event, 'vary', 'Accept, User-Agent')

  return send(event, buildNotFoundMarkdown({ path: event.path, message: error.message }))
}

export default notFoundMarkdownHandler
