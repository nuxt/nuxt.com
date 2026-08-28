import type { LLMsSection } from 'nuxt-llms'
import { joinURL } from 'ufo'
import { CURRENT_DOCS_VERSION, DOC_VERSIONS, type DocVersion } from '#shared/utils/docs'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import type { ContentPage } from '../utils/content/pages'

/**
 * Build `/llms.txt` and `/llms-full.txt` from the comark instances.
 */
const INDEX_VERSIONS: DocVersion[] = [CURRENT_DOCS_VERSION]

/** Every version, longest-lived first, for the full document. */
const FULL_VERSIONS: DocVersion[] = [...DOC_VERSIONS]

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', async (event, options) => {
    const domain = options.domain || getSiteUrl(event)

    options.sections.push({
      title: 'Documentation',
      description: 'Every page below is also available as raw markdown — append `.md` to any docs URL, or fetch `/raw/<path>.md`.',
      links: [{
        title: 'Landing page',
        description: 'What Nuxt is, and where to start',
        href: joinURL(domain, rawUrlForPage('/'))
      }]
    })

    for (const version of INDEX_VERSIONS) {
      const links = await docsLinks(version, domain)
      if (links.length) {
        options.sections.push({
          title: `Nuxt v${version.replace('.x', '')} Documentation`,
          description: `The current stable release. Other versions live under /docs/<version> and are listed in full in /llms-full.txt.`,
          links
        })
      }
    }

    // Not version-scoped
    const examples = await listInstancePages('examples').catch(() => [])
    if (examples.length) {
      options.sections.push({
        title: 'Examples',
        description: 'Runnable example projects, with their source',
        links: examples.map(page => toLink(page, domain))
      })
    }

    for (const { title, description, dir } of SITE_SECTIONS) {
      const links = await siteLinks(dir, domain)
      if (links.length) options.sections.push({ title, description, links })
    }

    options.sections.push({
      title: 'Optional',
      links: [
        { title: 'Modules', description: 'Every published Nuxt module, as markdown', href: joinURL(domain, '/raw/modules.md') },
        { title: 'Changelog', description: 'Releases of Nuxt and its official modules', href: joinURL(domain, '/raw/changelog.md') },
        { title: 'Design system', description: 'Brand and design guidelines', href: joinURL(domain, '/design.md') },
        { title: 'MCP server card', description: 'Tools agents can call directly', href: joinURL(domain, '/.well-known/mcp/server-card.json') }
      ]
    })
  })

  nitroApp.hooks.hook('llms:generate:full', async (_event, _options, contents) => {
    for (const version of FULL_VERSIONS) {
      for (const key of [docsInstanceKey(version), cliInstanceKey(version)]) {
        const content = await getInstanceAtHead(key).catch(() => null)
        if (!content) continue

        const pages = await listInstancePages(key)
        const rendered = await Promise.all(pages.map(page => renderPageMarkdown(content, page.path)))
        contents.push(...rendered.filter((page): page is string => Boolean(page)))
      }
    }

    const examplesContent = await getInstanceAtHead('examples').catch(() => null)
    if (examplesContent) {
      const pages = await listInstancePages('examples')
      const rendered = await Promise.all(pages.map(page => renderPageMarkdown(examplesContent, page.path)))
      contents.push(...rendered.filter((page): page is string => Boolean(page)))
    }

    const site = await getInstanceAtHead('site')
    for (const { dir } of SITE_SECTIONS) {
      const pages = await listInstancePages('site', { dir })
      const rendered = await Promise.all(pages.map(page => renderPageMarkdown(site, page.path)))
      contents.push(...rendered.filter((page): page is string => Boolean(page)))
    }
  })
})

/** nuxt.com's own content that belongs in the index, in order. */
const SITE_SECTIONS = [
  { title: 'Deployment Guides', description: 'Deploy a Nuxt application to any provider', dir: '/deploy' },
  { title: 'Blog', description: 'Release announcements and deep dives', dir: '/blog' }
] as const

async function docsLinks(version: DocVersion, domain: string): Promise<NonNullable<LLMsSection['links']>> {
  const [docs, cli] = await Promise.all([
    listInstancePages(docsInstanceKey(version)).catch(() => []),
    listInstancePages(cliInstanceKey(version)).catch(() => [])
  ])

  return [...docs, ...cli].map(page => toLink(page, domain))
}

async function siteLinks(dir: string, domain: string): Promise<NonNullable<LLMsSection['links']>> {
  const pages = await listInstancePages('site', { dir }).catch(() => [])

  return pages.map(page => toLink(page, domain))
}

function toLink(page: ContentPage, domain: string) {
  return {
    title: page.title,
    description: page.description || undefined,
    href: joinURL(domain, rawUrlForPage(page.path))
  }
}
