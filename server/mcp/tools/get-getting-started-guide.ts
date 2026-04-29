import { z } from 'zod'

export default defineMcpTool({
  description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
  inputSchema: {
    // TODO: add '5.x' when Nuxt 5 is released
    version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full guide.')
  },
  cache: '30m',
  async handler({ version, sections }) {
    const event = useEvent()
    const path = `/docs/${version}/getting-started/introduction`
    const docsVersion = version === '4.x' ? 'docsv4' : 'docsv3'
    const fullContent = await fetchPageMarkdown(event, docsVersion, path)

    if (!fullContent) {
      return errorResult(`Getting started guide not found: ${path}`)
    }

    const content = sections?.length
      ? extractSections(fullContent, sections)
      : fullContent

    return {
      content: [{ type: 'text' as const, text: content }]
    }
  }
})
