import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { getAgentSiteUrl } from '#agent-discovery'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import type { CliDocVersion } from '#shared/utils/cli'
import { AGENT_DOC_VERSIONS } from '#shared/utils/docs'

const inputSchema = z.object({
  version: z.enum(['3.x', '4.x', '5.x', 'all']).optional().default('4.x').describe('Documentation version to fetch'),
  search: z.string().optional().describe('Filter pages by keyword (matches title, path, and description). Strongly recommended to avoid large results.')
})

const getResult = defineCachedFunction(async (event: H3Event, { version, search }: z.output<typeof inputSchema>) => {
  let allDocs: { title: string, path: string, description: string }[] = []

  const versions: CliDocVersion[] = version === 'all' ? [...AGENT_DOC_VERSIONS] : [version as CliDocVersion]

  for (const docsVersion of versions) {
    const docs = await listInstancePages(docsInstanceKey(docsVersion))
    if (!docs.length) {
      if (version === 'all') continue
      throw createError({ statusCode: 404, message: 'Documentation pages collection not found' })
    }
    allDocs.push(...docs)
    allDocs.push(...await listInstancePages(cliInstanceKey(docsVersion)).catch(() => []))
  }

  allDocs.push(...await listInstancePages('examples'))

  if (search) {
    const terms = search.toLowerCase().split(/\s+/)
    allDocs = allDocs.filter((doc) => {
      const haystack = `${doc.title ?? ''} ${doc.path ?? ''} ${doc.description ?? ''}`.toLowerCase()
      return terms.every(t => haystack.includes(t))
    })
  }

  return allDocs.map(doc => ({
    title: doc.title,
    path: doc.path,
    ...(search ? { description: doc.description } : {}),
    url: `${getAgentSiteUrl(event)}${doc.path}`
  }))
}, {
  name: 'mcp-list-documentation-pages',
  maxAge: 3600,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args])
})

export default defineMcpTool({
  description: `Lists Nuxt documentation pages, optionally filtered by search term.

WHEN TO USE: When you need to find documentation about a topic but don't know the exact page path.
WHEN NOT TO USE: If you already know the page path, use get-documentation-page directly.
TIPS: Always pass a search term to narrow results — avoids dumping the entire catalog.`,
  inputSchema: inputSchema.meta({ examples: [
    { search: 'data fetching', version: '4.x' },
    { search: 'middleware' },
    { version: '3.x' }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: args => getResult(useEvent(), args)
})
