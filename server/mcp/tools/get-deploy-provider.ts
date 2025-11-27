import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: `Retrieves detailed deployment instructions and setup guide for a specific hosting provider.

WHEN TO USE: Use this tool when you know EXACTLY which provider the user wants. Common scenarios:
- User asks for a specific provider: "How do I deploy to Vercel?" → /deploy/vercel
- User mentions a known platform: "Cloudflare deployment" → /deploy/cloudflare
- You found a relevant provider from list_deploy_providers and want full details

WHEN NOT TO USE: If the user is asking about options or comparing providers, use list_deploy_providers first.

EXAMPLES: "/deploy/vercel", "/deploy/cloudflare", "/deploy/netlify", "/deploy/aws", "/deploy/node-server"`,
  inputSchema: {
    path: z.string().describe('The path to the deploy provider (e.g., /deploy/vercel)')
  },
  cache: '1h',
  async handler({ path }) {
    const event = useEvent()

    const provider = await queryCollection(event, 'deploy')
      .where('path', '=', path)
      .select('title', 'path', 'description', 'body', 'logoSrc', 'logoIcon', 'category', 'nitroPreset', 'website', 'sponsor')
      .first()

    if (!provider) {
      return errorResult('Deploy provider not found')
    }

    return jsonResult({
      title: provider.title,
      path: provider.path,
      description: provider.description,
      content: provider.body,
      logoSrc: provider.logoSrc,
      logoIcon: provider.logoIcon,
      category: provider.category,
      nitroPreset: provider.nitroPreset,
      website: provider.website,
      sponsor: provider.sponsor,
      url: `https://nuxt.com${provider.path}`
    })
  }
})
