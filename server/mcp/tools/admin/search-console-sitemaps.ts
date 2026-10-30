export default defineMcpTool({
  description: `Lists the sitemaps submitted for nuxt.com in Google Search Console, with last submission and download time, pending state, error and warning counts, and submitted URL counts per content type.

WHEN TO USE: Check that sitemaps are read without errors after a deploy or a URL structure change.`,
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  enabled: event => isMcpAdmin(event),
  async handler() {
    const { sitemap = [] } = await searchConsoleFetch<{ sitemap?: Record<string, unknown>[] }>('/webmasters/v3/sites/{siteUrl}/sitemaps')
    return { sitemaps: sitemap }
  }
})
