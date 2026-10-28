import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { splitSections, stripFrontmatter } from '../lib/docs-index.js'
import { appOrigin } from '../lib/internal-api.js'

const MAX_CHARS = 12_000

/** `https://nuxt.com/docs/4.x/x#y?z` and `/docs/4.x/x.md` → `/docs/4.x/x`; unversioned docs paths get the current version. */
function normalizePagePath(input: string): string {
  let path = input.trim().replace(/^https?:\/\/[^/]+/, '').replace(/[#?].*$/, '').replace(/\.md$/, '').replace(/\/$/, '')
  if (!path.startsWith('/')) path = `/${path}`
  if (/^\/docs\/(?!\d+\.x\/)/.test(path)) path = path.replace(/^\/docs\//, '/docs/4.x/')
  return path
}

/** A module's README from GitHub; catalog repos look like `owner/name`, `owner/name#branch` or `owner/name#branch/sub/dir`. */
async function fetchModuleReadme(slug: string): Promise<string | null> {
  const response = await fetch(`https://api.nuxt.com/modules/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) return null
  const mod = await response.json() as { repo?: string, stats?: { defaultBranch?: string } }
  if (!mod.repo) return null
  const [repo, ref = ''] = mod.repo.split('#')
  const [branch = mod.stats?.defaultBranch || 'main', ...dir] = ref ? ref.split('/') : []
  const candidates = [dir.length && `${dir.join('/')}/README.md`, 'README.md'].filter(Boolean)
  for (const file of candidates) {
    const readme = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`, { signal: AbortSignal.timeout(10_000) })
    if (readme.ok) return await readme.text()
  }
  return null
}

async function fetchPageMarkdown(pagePath: string): Promise<string | null> {
  const response = await fetch(`${appOrigin()}/raw${pagePath}.md`, { signal: AbortSignal.timeout(10_000) })
  // A module page is only served as Markdown when nuxt.com hosts the module's docs: else its README.
  const moduleSlug = pagePath.match(/^\/modules\/([^/]+)$/)?.[1]
  if (moduleSlug && response.status === 404) return await fetchModuleReadme(moduleSlug)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Page ${pagePath} failed (${response.status})`)
  return await response.text()
}

export default defineTool({
  description: 'Read a nuxt.com page as Markdown: a docs page (`/docs/4.x/…`, also `/docs/3.x/…`; not `/docs/5.x/…`), a deployment guide (`/deploy/…`), a blog post (`/blog/…`), an example, a module\'s README (`/modules/<slug>`), or a page of the module docs nuxt.com hosts (`/modules/<slug>/…`). Pass `sections` with h2/h3 titles to get only those parts of a long page; omit it for a summary of the whole page.',
  inputSchema: z.object({
    path: z.string().describe('Root-relative path or nuxt.com URL, e.g. "/docs/4.x/getting-started/state-management"'),
    sections: z.array(z.string()).optional().describe('Heading titles to keep (case-insensitive substring match)')
  }),
  async execute({ path, sections }) {
    const pagePath = normalizePagePath(path)
    if (pagePath.startsWith('/docs/5.x/')) {
      return { error: `Nightly docs are not served as Markdown here. Call nuxt-mcp__get-documentation-page with { path: "${pagePath}" } instead.` }
    }
    const markdown = await fetchPageMarkdown(pagePath)
    if (markdown === null) {
      return { error: `No page at ${pagePath}. Use search_docs (or search_modules) to find the right path.` }
    }

    let content = stripFrontmatter(markdown)
    if (sections?.length) {
      const wanted = sections.map(s => s.toLowerCase().replace(/`/g, ''))
      const parts = splitSections(content).filter(part =>
        part.headings.some(h => wanted.some(w => h.toLowerCase().replace(/`/g, '').includes(w))))
      if (parts.length) content = parts.map(part => part.text).join('\n\n')
    }

    const truncated = content.length > MAX_CHARS
    return {
      path: pagePath,
      content: truncated ? `${content.slice(0, MAX_CHARS)}\n…` : content,
      ...(truncated && { note: 'Truncated: pass `sections` to read the rest.' })
    }
  }
})
