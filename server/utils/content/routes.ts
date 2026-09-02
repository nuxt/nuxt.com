/**
 * Which content paths own a URL on the site.
 */
const NON_ROUTE_EXACT = new Set(['/design', '/info', '/enterprise/manual-sponsors', '/enterprise/support'])
const NON_ROUTE_PREFIXES = ['/templates/', '/video-courses/']

export function isContentRoute(path: string): boolean {
  return !NON_ROUTE_EXACT.has(path) && !NON_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix))
}
