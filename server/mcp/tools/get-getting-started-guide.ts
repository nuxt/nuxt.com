import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
  inputSchema: {
    version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version')
  },
  cache: '30m',
  async handler({ version }) {
    const event = useEvent()
    const path = `/docs/${version}/getting-started/introduction`
    const docsVersion = version === '4.x' ? 'docsv4' : 'docsv3'

    const page = await queryCollection(event, docsVersion)
      .where('path', '=', path)
      .select('title', 'path', 'description', 'body', 'links')
      .first()

    if (!page) {
      return errorResult('Getting started guide not found')
    }

    return jsonResult({
      title: page.title,
      path: page.path,
      description: page.description,
      content: page.body,
      version: version,
      links: page.links,
      url: `https://nuxt.com${page.path}`
    })
  }
})
