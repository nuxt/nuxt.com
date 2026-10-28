import { cliInstanceKey, docsInstanceKey, moduleInstanceKey } from '#shared/utils/content'
import { CURRENT_DOCS_VERSION } from '#shared/utils/docs'
import { supportsNuxt3OrLater } from '#shared/utils/modules'
import { MODULE_DOCS_NAMES, moduleDocsPathPrefix } from '#shared/utils/module-docs'

// Sitemap source for @nuxtjs/sitemap (see `sitemap.sources` in nuxt.config).
export default defineEventHandler(async (event) => {
  const [docs, cli, examples, siteContent, modules, moduleDocs] = await Promise.all([
    listInstancePages(docsInstanceKey(CURRENT_DOCS_VERSION)),
    listInstancePages(cliInstanceKey(CURRENT_DOCS_VERSION)).catch(() => []),
    listInstancePages('examples').catch(() => []),
    getInstanceAtHead('site'),
    fetchModules(event).then(list => list ?? []).catch(() => []),
    // Hosted module docs; their root is the module page, already listed with the modules below.
    Promise.all(MODULE_DOCS_NAMES.map(name => listInstancePages(moduleInstanceKey(name))
      .then(pages => pages.filter(page => page.path !== moduleDocsPathPrefix(name)))
      .catch(() => [])))
  ])

  // The site instance holds markdown pages and the yml-backed landing pages
  const site = (await siteContent.list())
    .filter((item) => {
      const stem = item.meta.stem.split('/').pop()!
      return ['.md', '.yml'].includes(item.meta.extension)
        && !stem.startsWith('.')
        && isContentRoute(item.path)
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
    ...moduleDocs.flat().map(page => ({ loc: page.path })),
    ...site,
    // Same modules as the /modules listing: Nuxt 2-only ones keep their page but stay out, like legacy docs.
    ...modules.filter(module => supportsNuxt3OrLater(module.compatibility.nuxt)).map(module => ({ loc: `/modules/${module.name}` }))
  ]
})
