import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { getDocsIndex, searchIndex } from '../../../../layers/nuxi/agent/lib/docs-index'

const inputSchema = z.object({
  query: z.string().min(2).describe('Keywords, API names, config keys or an error message excerpt'),
  scope: z.enum(['all', 'docs', 'deploy', 'modules', 'blog']).optional().default('all').describe('Restrict to the docs (/docs/4.x), the deployment guides (/deploy), the hosted module docs (/modules) or the blog (/blog)')
})

const getResult = defineCachedFunction(async (_event: H3Event, { query, scope = 'all' }: z.output<typeof inputSchema>) => {
  const results = searchIndex(await getDocsIndex(), query, { limit: 6, perSectionChars: 1800, prefix: scope === 'all' ? undefined : `/${scope}/` })
  return results.length ? { results } : { results, hint: 'No match. Try other keywords or an API name.' }
}, {
  name: 'mcp-search-documentation',
  maxAge: 1800,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args])
})

/** The MCP twin of Nuxi's `search_docs`, on the same index. */
export default defineMcpTool({
  description: `Full-text search of the Nuxt v4 documentation, the deployment guides, the docs of the official modules nuxt.com hosts (/modules/<slug>/…) and the Nuxt blog, whose release posts explain recently added features. Returns the best-matching sections with their content, page path and anchor link, usually enough to answer without fetching the page.

WHEN TO USE: First, for any Nuxt how-to question, error message, composable, utility or config option, especially APIs added recently that you may not know: data fetching (useFetch, useAsyncData, createUseFetch, enabled, addons), state (useState, clearNuxtState), routing and middleware, layouts (useLayout), runtimeConfig and environment variables, server routes and nuxt/server, sessions and appSecret, cookies (useCookie), SEO and useHead, hydration errors, rendering and route rules, caching, prerendering, testing, layers, modules, deployment, upgrading.
WHEN NOT TO USE: To read a whole page you already know, use get-documentation-page.

TIPS: Use keywords and API names, not full sentences ("useFetch enabled", "hydration mismatch", "nuxt/server useSession"). For several topics, call it once per topic.`,
  inputSchema: inputSchema.meta({ examples: [
    { query: 'useFetch enabled conditional' },
    { query: 'cloudflare preset', scope: 'deploy' }
  ] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: args => getResult(useEvent(), args)
})
