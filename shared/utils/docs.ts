// Single source of truth for which Nuxt docs versions are exposed to humans
// and agents. "Supported" here means the docs are published and crawlable, not
// that the release line is maintained: 3.x is end of life but still served.
// Bumping this list flips every version-aware surface at once:
//
//   - app/pages/docs/[...slug].vue        → canonical/markdown alternate emission
//   - modules/md-rewrite.ts               → Vercel edge rewrites for `.md` and Accept/UA negotiation
//   - server/routes/.well-known/**        → API catalog + MCP server card link to versioned docs
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

// `(?!5\.x/)` — Vercel route fragment used inside `^/docs/(?!5\.x/)(.+)$`.
// Negative lookahead form so unversioned URLs like `/docs/api.md` still rewrite.
export const EXCLUDED_DOCS_PATH_LOOKAHEAD
  = `(?!(?:${EXCLUDED_DOC_VERSIONS.map(escape).join('|')})/)`

/**
 * Docs + examples Comark source names per version collection.
 * Kept separate (not merge()) so each source keeps its own path prefix.
 */
export const docsSourceGroups = {
  docsv3: ['docsv3', 'examplesv3'],
  docsv4: ['docsv4', 'examplesv4'],
  docsv5: ['docsv5', 'examplesv5']
} as const

export type DocsCollection = keyof typeof docsSourceGroups

/** Flat list of all docs/examples source names. */
export const docsSources = Object.values(docsSourceGroups).flat()

/** Map a docs version collection name to its Comark sources. */
export function docsSourcesFromCollection(collection: string | undefined): readonly string[] {
  if (collection === 'docsv3' || collection === 'docsv4' || collection === 'docsv5') {
    return docsSourceGroups[collection]
  }
  return docsSourceGroups.docsv4
}
