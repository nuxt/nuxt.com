import { z } from 'zod'

const inputSchema = z.object({
  url: z.string().describe('Full URL (https://nuxt.com/...) or path (/docs/...).')
})

export default defineMcpTool({
  name: 'search-console-inspect-url',
  title: 'Search Console Inspect Url',
  group: 'admin',
  description: `Inspects how Google indexes one nuxt.com URL (Search Console URL Inspection): coverage and indexing state, Google-selected vs declared canonical, last crawl time, robots.txt / page fetch status, sitemaps referencing it, and rich results.

WHEN TO USE: Check why a page is missing from search or has no impressions in \`search-console-analytics\`, or confirm a fix (redirect, canonical, noindex) has been picked up.

NOTES: Quota is ~2000 inspections per day, so inspect specific pages rather than looping over the whole site. Reflects Google's indexed version, not a live test.`,
  inputSchema: inputSchema.meta({ examples: [
    { url: '/docs/4.x/getting-started/introduction' }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  async handler({ url }) {
    const inspectionUrl = url.startsWith('/') ? `https://nuxt.com${url}` : url
    const { inspectionResult } = await searchConsoleFetch<{ inspectionResult: Record<string, unknown> }>('/v1/urlInspection/index:inspect', {
      method: 'POST',
      body: { inspectionUrl, siteUrl: useRuntimeConfig().googleSearchConsole.siteUrl }
    })
    return { url: inspectionUrl, ...inspectionResult }
  }
})
