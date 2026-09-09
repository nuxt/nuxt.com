// Single source of truth for which Nuxt docs versions are exposed to humans
// and agents. "Supported" here means the docs are published and crawlable, not
// that the release line is maintained: 3.x is end of life but still served.
// Bumping this list flips every version-aware surface at once:
//
//   - app/pages/docs/[...slug].vue        → canonical/markdown alternate emission
//   - nuxt.config.ts (agentDiscovery)     → excluded versions never negotiate markdown, MCP server card docs link
//   - server/plugins/agent-discovery.ts   → generated /raw/index.md links to versioned docs
//   - app/middleware/docs-version.global.ts → unversioned `/docs/*` redirect target
//   - nuxt.config.ts (content:file:beforeParse) → version segment inserted into internal docs links
//     via DOCS_COLLECTION_VERSIONS, whose keys must match the collection names in content.config.ts
//
// When Nuxt 5 ships: move `'5.x'` from EXCLUDED_DOC_VERSIONS into
// SUPPORTED_DOC_VERSIONS and bump CURRENT_DOCS_VERSION.
export const SUPPORTED_DOC_VERSIONS = ['3.x', '4.x'] as const
export const EXCLUDED_DOC_VERSIONS = ['5.x'] as const
export const CURRENT_DOCS_VERSION: (typeof SUPPORTED_DOC_VERSIONS)[number] = '4.x'

// Content collection id (the first segment of `file.id`) → docs version.
export const DOCS_COLLECTION_VERSIONS: Record<string, string | undefined> = Object.fromEntries(
  [...SUPPORTED_DOC_VERSIONS, ...EXCLUDED_DOC_VERSIONS].map(version => [`docsv${version.split('.')[0]}`, version])
)

// Docs sources write internal links unversioned so a docs PR can be
// cherry-picked between release branches unchanged. The URL-opening delimiter
// is what keeps `/assets/docs/…` and external `…/docs/…` URLs out of scope.
export function insertDocsVersion(body: string, version: string) {
  return body.replaceAll(/(["'(=])\/docs\/(?!\d\.x)/g, `$1/docs/${version}/`)
}

const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `^/docs/(?:3\.x|4\.x)(?:/|$)` — matches versioned doc paths only.
export const SUPPORTED_DOCS_PATH_REGEX = new RegExp(
  `^/docs/(?:${SUPPORTED_DOC_VERSIONS.map(escape).join('|')})(?:/|$)`
)
