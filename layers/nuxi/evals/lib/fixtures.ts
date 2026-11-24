import type { ToolStub } from 'eve/evals'

/** One `search_docs` section, in the shape `agent/lib/docs-index.ts` returns. */
export function docsHit(path: string, anchor: string, section: string, content: string) {
  return { title: section, path, section, url: `${path}#${anchor}`, content }
}

export const useStateHit = docsHit(
  '/docs/4.x/api/composables/use-state',
  'usage',
  'useState › Usage',
  'useState is an SSR-friendly ref replacement. Its value is preserved after server-side rendering and shared across all components using a unique key: `const counter = useState(\'counter\', () => 0)`.'
)

export function searchDocsStub(results: unknown[]): ToolStub {
  return { id: 'search-docs', tool: 'search_docs', outcome: { response: { results } } }
}

export const searchDocsDown: ToolStub = {
  id: 'search-docs-down',
  tool: 'search_docs',
  outcome: { throw: { name: 'TimeoutError', message: 'Docs index timed out' } }
}

/** Every other docs path fails too, so the reply can't route around the outage. */
export const readPageDown: ToolStub = {
  id: 'read-page-down',
  tool: 'read_page',
  outcome: { throw: { message: 'nuxt.com is unreachable' } }
}

export const wordCount = (text: string | undefined) => (text ?? '').trim().split(/\s+/u).filter(Boolean).length
