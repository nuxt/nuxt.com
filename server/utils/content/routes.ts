import type { H3Event } from 'h3'
import { rawUrl, useAgentDiscoveryConfig } from '#agent-discovery'

/**
 * Which content paths own a URL on the site.
 */
const NON_ROUTE_EXACT = new Set(['/design', '/info', '/enterprise/manual-sponsors', '/enterprise/support'])
const NON_ROUTE_PREFIXES = ['/templates/', '/video-courses/']

export function isContentRoute(path: string): boolean {
  return !NON_ROUTE_EXACT.has(path) && !NON_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix))
}

/**
 * Page path -> raw markdown URL, or `undefined` when the page has no markdown twin.
 */
export function rawUrlForPage(event: H3Event, path: string): string | undefined {
  const resolved = new URL(rawUrl(event, path)).pathname
  const { rawPrefix } = useAgentDiscoveryConfig(event)

  return resolved === rawPrefix || resolved.startsWith(`${rawPrefix}/`) ? resolved : undefined
}
