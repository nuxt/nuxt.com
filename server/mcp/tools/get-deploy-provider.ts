import { z } from 'zod/v3'

export default defineMcpTool({
  description: `Retrieves detailed deployment instructions and setup guide for a specific hosting provider.

WHEN TO USE: Use this tool when you know EXACTLY which provider the user wants. Common scenarios:
- User asks for a specific provider: "How do I deploy to Vercel?" → /deploy/vercel
- User mentions a known platform: "Cloudflare deployment" → /deploy/cloudflare
- You found a relevant provider from list_deploy_providers and want full details

WHEN NOT TO USE: If the user is asking about options or comparing providers, use list_deploy_providers first.

EXAMPLES: "/deploy/vercel", "/deploy/cloudflare", "/deploy/netlify", "/deploy/aws", "/deploy/node-server"`,
  inputSchema: {
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)')
  },
  async handler(params: any) {
    const result = await $fetch('/api/mcp/get-deploy-provider', { query: params })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
