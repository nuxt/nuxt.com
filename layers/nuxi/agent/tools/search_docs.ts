import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { getDocsIndex, searchIndex } from '../lib/docs-index.js'

export default defineTool({
  description: 'Full-text search over the Nuxt v4 documentation, the deployment guides and the docs of the official modules nuxt.com hosts (`/modules/<slug>/…`). Returns the best-matching sections with their content, page path and anchor link, in one call — usually enough to answer without fetching the page. Use keywords and API names, not full sentences (e.g. "useState pinia shared state", "nuxt instance unavailable", "cloudflare workers preset"). For several topics, call it once per topic in parallel.',
  inputSchema: z.object({
    query: z.string().min(2).describe('Keywords, API names, config keys or an error message excerpt'),
    scope: z.enum(['all', 'docs', 'deploy', 'modules']).default('all').describe('Restrict to the docs (`/docs/4.x`), the deployment guides (`/deploy`) or the hosted module docs (`/modules`)')
  }),
  async execute({ query, scope }) {
    const index = await getDocsIndex()
    const prefix = scope === 'all' ? undefined : `/${scope}/`
    const results = searchIndex(index, query, { limit: 6, perSectionChars: 1800, prefix })
    if (!results.length) {
      return { results, hint: 'No match. Try other keywords or an API name.' }
    }
    return { results }
  }
})
