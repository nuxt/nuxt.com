import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: `Lists all available Nuxt documentation pages with their categories and basic information.

WHEN TO USE: Use this tool when you need to EXPLORE or SEARCH for documentation about a topic but don't know the exact page path. For example: "Find documentation about hydration errors", "What pages cover rendering modes?", "Search for migration guides".

WHEN NOT TO USE: If you already know the specific page path (e.g., "/docs/4.x/getting-started/introduction"), use get_documentation_page directly instead.

WORKFLOW: This tool returns page titles, descriptions, and paths. After finding relevant pages, use get_documentation_page to retrieve the full content.`,
  inputSchema: {
    version: z.enum(['3.x', '4.x', 'all']).optional().default('4.x').describe('Documentation version to fetch')
  },
  cache: '1h',
  async handler({ version }) {
    const event = useEvent()
    let allDocs = []

    if (version === '3.x') {
      allDocs = await queryCollection(event, 'docsv3')
        .select('title', 'path', 'description')
        .all()

      if (!allDocs) {
        return {
          content: [{ type: 'text' as const, text: 'Documentation pages collection not found' }],
          isError: true
        }
      }
    } else if (version === '4.x') {
      allDocs = await queryCollection(event, 'docsv4')
        .select('title', 'path', 'description')
        .all()

      if (!allDocs) {
        return {
          content: [{ type: 'text' as const, text: 'Documentation pages collection not found' }],
          isError: true
        }
      }
    } else {
      const docsV3 = await queryCollection(event, 'docsv3')
        .select('title', 'path', 'description')
        .all()

      const docsV4 = await queryCollection(event, 'docsv4')
        .select('title', 'path', 'description')
        .all()

      if (!docsV3 || !docsV4) {
        return {
          content: [{ type: 'text' as const, text: 'Documentation pages collection not found' }],
          isError: true
        }
      }

      allDocs = [...docsV3, ...docsV4]
    }

    const result = allDocs.map(doc => ({
      title: doc.title,
      path: doc.path,
      description: doc.description,
      version: doc.path.includes('/docs/4.x') ? '4.x' : '3.x',
      url: `https://nuxt.com${doc.path}`
    }))

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
