import { z } from 'zod'

export default defineMcpTool({
  description: `Inspects how Google indexes one nuxt.com URL (Search Console URL Inspection): coverage and indexing state, Google-selected vs declared canonical, last crawl time, robots.txt / page fetch status, sitemaps referencing it, and rich results.

WHEN TO USE: Check why a page is missing from search or has no impressions in \`search-console-analytics\`, or confirm a fix (redirect, canonical, noindex) has been picked up.

NOTES: Quota is ~2000 inspections per day, so inspect specific pages rather than looping over the whole site. Reflects Google's indexed version, not a live test.`,
  inputSchema: {
    url: z.string().describe('Full URL (https://nuxt.com/...) or path (/docs/...).')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  inputExamples: [
    { url: '/docs/4.x/getting-started/introduction' }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ url }) {
    const inspectionUrl = url.startsWith('/') ? `https://nuxt.com${url}` : url
    const { inspectionResult } = await searchConsoleFetch<{ inspectionResult: Record<string, unknown> }>('/v1/urlInspection/index:inspect', {
      method: 'POST',
      body: { inspectionUrl, siteUrl: useRuntimeConfig().googleSearchConsole.siteUrl }
    })
    return { url: inspectionUrl, ...inspectionResult }
  }
})
