import { z } from 'zod'

export default defineMcpTool({
  description: `Retrieves detailed deployment instructions and setup guide for a specific hosting provider.

WHEN TO USE: Use this tool when you know EXACTLY which provider the user wants. Common scenarios:
- User asks for a specific provider: "How do I deploy to Vercel?" → /deploy/vercel
- User mentions a known platform: "Cloudflare deployment" → /deploy/cloudflare
- You found a relevant provider from list_deploy_providers and want full details

WHEN NOT TO USE: If the user is asking about options or comparing providers, use list_deploy_providers first.

EXAMPLES: "/deploy/vercel", "/deploy/cloudflare", "/deploy/netlify", "/deploy/aws", "/deploy/node-server"`,
  inputSchema: {
    path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full content.')
  },
  cache: '1h',
  async handler({ path, sections }) {
    try {
      const fullContent = await $fetch<string>(`/raw${path}.md`)

      let content = fullContent
      if (sections?.length) {
        content = extractSections(fullContent, sections)
      }

      return {
        content: [{ type: 'text' as const, text: content }]
      }
    } catch (error) {
      return errorResult(`Deploy provider not found: ${error}`)
    }
  }
})
