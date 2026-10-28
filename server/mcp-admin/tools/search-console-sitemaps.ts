export default defineMcpTool({
  name: 'search-console-sitemaps',
  title: 'Search Console Sitemaps',
  group: 'admin',
  description: `Lists the sitemaps submitted for nuxt.com in Google Search Console, with last submission and download time, pending state, error and warning counts, and submitted URL counts per content type.

WHEN TO USE: Check that sitemaps are read without errors after a deploy or a URL structure change.`,
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  async handler() {
    const { sitemap = [] } = await searchConsoleFetch<{ sitemap?: Record<string, unknown>[] }>('/webmasters/v3/sites/{siteUrl}/sitemaps')
    return { sitemaps: sitemap }
  }
})
