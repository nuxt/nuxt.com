import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import { CURRENT_DOCS_VERSION } from '#shared/utils/docs'

// Sitemap source for @nuxtjs/sitemap (see `sitemap.sources` in nuxt.config).
// Resolved at request time from the comark instances; app sources are off
// because the module's automatic discovery has nothing to walk here and the
// site content is the source of truth. Only the current docs version is
// listed, mirroring what the site advertises to agents.
export default defineEventHandler(async () => {
  const [docs, cli, examples, siteContent] = await Promise.all([
    listInstancePages(docsInstanceKey(CURRENT_DOCS_VERSION)),
    listInstancePages(cliInstanceKey(CURRENT_DOCS_VERSION)).catch(() => []),
    listInstancePages('examples').catch(() => []),
    getInstanceAtHead('site')
  ])

  // The site instance holds markdown pages and the yml-backed landing pages
  // (`/blog`, `/modules`, `/team`, …), which are routes of their own. Data
  // collections that back a page without being one are filtered by the same
  // rule every agent listing uses (`isAgentListedRoute`).
  const site = (await siteContent.list())
    .filter((item) => {
      const stem = item.meta.stem.split('/').pop()!
      return ['.md', '.yml'].includes(item.meta.extension)
        && !stem.startsWith('.')
        && isAgentListedRoute(item.path)
        && !(item.data as { draft?: boolean } | undefined)?.draft
    })
    .map((item) => {
      const date = (item.data as { date?: string } | undefined)?.date
      return { loc: item.path, ...(date ? { lastmod: date } : {}) }
    })

  return [
    ...docs.map(page => ({ loc: page.path })),
    ...cli.map(page => ({ loc: page.path })),
    ...examples.map(page => ({ loc: page.path })),
    ...site
  ]
})
