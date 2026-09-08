// Single source of truth for which Nuxt docs versions are exposed to humans
// and agents. "Supported" here means the docs are published and crawlable, not
// that the release line is maintained: 3.x is end of life but still served.
// Bumping this list flips every version-aware surface at once:
//
//   - app/pages/docs/[...slug].vue        → canonical/markdown alternate emission
//   - nuxt.config.ts (agentDiscovery)     → excluded versions never negotiate markdown, MCP server card docs link
//   - server/plugins/agent-discovery.ts   → generated /raw/index.md links to versioned docs
//   - app/middleware/docs-version.global.ts → unversioned `/docs/*` redirect target
//
// When Nuxt 5 ships: move `'5.x'` from EXCLUDED_DOC_VERSIONS into
// SUPPORTED_DOC_VERSIONS and bump CURRENT_DOCS_VERSION.
export const SUPPORTED_DOC_VERSIONS = ['3.x', '4.x'] as const
export const EXCLUDED_DOC_VERSIONS = ['5.x'] as const
export const CURRENT_DOCS_VERSION: (typeof SUPPORTED_DOC_VERSIONS)[number] = '4.x'

const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `^/docs/(?:3\.x|4\.x)(?:/|$)` — matches versioned doc paths only.
export const SUPPORTED_DOCS_PATH_REGEX = new RegExp(
  `^/docs/(?:${SUPPORTED_DOC_VERSIONS.map(escape).join('|')})(?:/|$)`
)
