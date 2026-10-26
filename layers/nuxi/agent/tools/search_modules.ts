import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { tokenize } from '../lib/docs-index.js'

const MODULES_API = 'https://api.nuxt.com/modules'
const CATALOG_TTL_MS = 60 * 60 * 1000

interface CatalogModule {
  name: string
  npm: string
  description: string
  category: string
  type: string
  website?: string
  stats?: { downloads?: number, stars?: number }
  compatibility?: { nuxt?: string }
}

let catalog: { modules: CatalogModule[], loadedAt: number } | null = null

async function getCatalog(): Promise<CatalogModule[]> {
  if (catalog && Date.now() - catalog.loadedAt < CATALOG_TTL_MS) return catalog.modules
  const response = await fetch(MODULES_API, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`Module API ${response.status}`)
  const data = await response.json() as { modules: CatalogModule[] }
  catalog = { modules: data.modules, loadedAt: Date.now() }
  return data.modules
}

export default defineTool({
  description: 'Search the Nuxt modules directory by keywords (e.g. "auth oauth", "tailwind", "i18n", "image optimization"). Returns the best matches with slug, npm package, description, category and popularity. Then call `show_module` with the slug of the module you recommend.',
  inputSchema: z.object({
    query: z.string().min(2).describe('What the module should do, or part of its name'),
    limit: z.number().int().min(1).max(10).default(6)
  }),
  async execute({ query, limit }) {
    const modules = await getCatalog()
    const terms = [...new Set(tokenize(query))].filter(term => !term.includes('+'))
    if (!terms.length) return { modules: [] }

    const scored = modules.map((mod) => {
      const name = new Set(tokenize(`${mod.name} ${mod.npm.replace(/[@/]/g, ' ')}`))
      const text = new Set(tokenize(`${mod.description} ${mod.category}`))
      const matched = terms.filter(term => name.has(term) || text.has(term))
      const score = matched.reduce((sum, term) => sum + (name.has(term) ? 3 : 1), 0)
      const popularity = Math.log10(1 + (mod.stats?.downloads ?? 0))
      return { mod, score: score ? score * (matched.length / terms.length) * 10 + popularity + (mod.type === 'official' ? 2 : 0) : 0 }
    }).filter(entry => entry.score > 0)

    scored.sort((a, b) => b.score - a.score)
    return {
      modules: scored.slice(0, limit).map(({ mod }) => ({
        slug: mod.name,
        npm: mod.npm,
        description: mod.description,
        category: mod.category,
        type: mod.type,
        downloads: mod.stats?.downloads,
        stars: mod.stats?.stars,
        nuxt: mod.compatibility?.nuxt
      }))
    }
  }
})
