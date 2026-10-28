import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { getAgentDocument } from '#agent-discovery'

const inputSchema = z.object({
  path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)'),
  sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full content.')
})

const getResult = defineCachedFunction(async (event: H3Event, { path, sections }: z.output<typeof inputSchema>) => {
  const document = await getAgentDocument(event, path, { sections })

  if (!document || 'redirect' in document) {
    throw createError({ statusCode: 404, message: `Deploy provider not found: ${path}` })
  }

  return document.markdown
}, {
  name: 'mcp-get-deploy-provider',
  maxAge: 3600,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args])
})

export default defineMcpTool({
  description: `Retrieves detailed deployment instructions and setup guide for a specific hosting provider.

WHEN TO USE: Use this tool when you know EXACTLY which provider the user wants. Common scenarios:
- User asks for a specific provider: "How do I deploy to Vercel?" → /deploy/vercel
- User mentions a known platform: "Cloudflare deployment" → /deploy/cloudflare
- You found a relevant provider from list-deploy-providers and want full details

WHEN NOT TO USE: If the user is asking about options or comparing providers, use list-deploy-providers first.

EXAMPLES: "/deploy/vercel", "/deploy/cloudflare", "/deploy/netlify", "/deploy/aws", "/deploy/node-server"`,
  inputSchema: inputSchema.meta({ examples: [
    { path: '/deploy/vercel' },
    { path: '/deploy/cloudflare', sections: ['Setup'] }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: args => getResult(useEvent(), args)
})
