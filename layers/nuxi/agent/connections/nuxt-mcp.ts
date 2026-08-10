import { defineMcpClientConnection } from 'eve/connections'
import { appOrigin } from '../lib/internal-api.js'

/**
 * The server stays public — this only tells `report-feedback` that Nuxi is the
 * caller. Missing secret is not fatal: the docs tools work without it.
 */
function callerHeaders(): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export default defineMcpClientConnection({
  url: `${appOrigin()}/mcp`,
  description: 'Nuxt.com documentation, blog, modules catalog, deploy providers, changelog, and reporting documentation gaps back to the Nuxt team.',
  headers: callerHeaders
})
