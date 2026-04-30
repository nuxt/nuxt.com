import { z } from 'zod'

export default defineMcpTool({
  description: `Retrieves the official "Getting Started" introduction page for a given Nuxt major version.

WHEN TO USE: When the user wants a high-level overview / setup guide for Nuxt without specifying a precise documentation page.
WHEN NOT TO USE: For a specific page outside the introduction, prefer get_documentation_page.`,
  inputSchema: {
    // TODO: add '5.x' when Nuxt 5 is released
    version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt major version'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full guide.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { version: '4.x' },
    { version: '3.x', sections: ['Quick Start'] }
  ],
  cache: '30m',
  async handler({ version, sections }) {
    const event = useEvent()
    const path = `/docs/${version}/getting-started/introduction`
    const docsVersion = version === '4.x' ? 'docsv4' : 'docsv3'
    const fullContent = await fetchPageMarkdown(event, docsVersion, path)

    if (!fullContent) {
      throw createError({ statusCode: 404, message: `Getting started guide not found: ${path}` })
    }

    return sections?.length
      ? extractSections(fullContent, sections)
      : fullContent
  }
})
