/**
 * Test double for the `#agent-discovery` Nitro alias (mapped in `vitest.config.ts`), so
 * `routes.ts` can be unit-tested without booting Nuxt.
 *
 * Mirrors the contract `rawUrlForPage` depends on: `rawUrl()` resolves a page to its raw markdown
 * destination when a route matches, or hands the path back untouched when nothing does. The route
 * table below mirrors `agentDiscovery.routes` in `nuxt.config.ts` — keep the two in sync.
 */
type StubRoute = string | { path: string, raw?: string }

const RAW_PREFIX = '/raw'

const ROUTES: StubRoute[] = [
  { path: '/', raw: '/raw/index.md' },
  '/docs/**',
  '/blog/**',
  '/deploy/**',
  { path: '/modules', raw: '/raw/modules.md' },
  { path: '/changelog', raw: '/raw/changelog.md' }
]

/** First route whose pattern matches `pathname`, in declaration order — `**` matches a prefix. */
function matchRoute(pathname: string): StubRoute | undefined {
  return ROUTES.find((route) => {
    const pattern = typeof route === 'string' ? route : route.path
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3)
      return pathname === prefix || pathname.startsWith(`${prefix}/`)
    }
    return pathname === pattern
  })
}

/** `raw` is only honoured on exact patterns; wildcard patterns fall back to `rawPrefix + path + '.md'`. */
function rawDestination(route: StubRoute, pathname: string): string {
  if (typeof route !== 'string' && route.raw) return route.raw

  return `${RAW_PREFIX}${pathname === '/' ? '/index' : pathname}.md`
}

export function useAgentDiscoveryConfig() {
  return { rawPrefix: RAW_PREFIX }
}

export function rawUrl(_event: unknown, path: string): string {
  const route = matchRoute(path)

  return `http://localhost${route ? rawDestination(route, path) : path}`
}
