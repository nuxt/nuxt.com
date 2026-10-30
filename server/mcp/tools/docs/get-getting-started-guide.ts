import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { getAgentDocument } from '#agent-discovery'

const inputSchema = z.object({
  version: z.enum(['3.x', '4.x', '5.x']).optional().default('4.x').describe('Nuxt major version'),
  sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full guide.')
})

const getResult = defineCachedFunction(async (event: H3Event, { version, sections }: z.output<typeof inputSchema>) => {
  const path = `/docs/${version}/getting-started/introduction`
  // `includeExcluded` so the nightly version stays reachable here while
  // `excludePrefixes` keeps it out of the public listings.
  const document = await getAgentDocument(event, path, { sections, includeExcluded: true })

  if (!document || 'redirect' in document) {
    throw createError({ statusCode: 404, message: `Getting started guide not found: ${path}` })
  }

  return document.markdown
}, {
  name: 'mcp-get-getting-started-guide',
  maxAge: 1800,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args])
})

export default defineMcpTool({
  description: `Retrieves the official "Getting Started" introduction page for a given Nuxt major version.

WHEN TO USE: When the user wants a high-level overview / setup guide for Nuxt without specifying a precise documentation page.
WHEN NOT TO USE: For a specific page outside the introduction, prefer get-documentation-page.`,
  inputSchema: inputSchema.meta({ examples: [
    { version: '4.x' },
    { version: '3.x', sections: ['Quick Start'] }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: args => getResult(useEvent(), args)
})
