import { defineTool } from 'eve/tools'
import { z } from 'zod'

const MODULE_API = 'https://api.nuxt.com/modules'

function slugCandidates(raw: string): string[] {
  const t = raw.trim()
  const lower = t.toLowerCase()
  const hyphenated = lower.replace(/\s+/g, '-')
  const set = new Set([t, lower, hyphenated])

  if (lower === '@nuxthub/core' || (lower.endsWith('/core') && lower.includes('nuxthub'))) {
    set.add('hub')
  }
  if (
    ['nuxthub', 'nuxt-hub', 'nuxt hub'].includes(lower)
    || (lower.includes('nuxt') && lower.includes('hub') && !lower.includes('devtools'))
  ) {
    set.add('hub')
  }

  return [...set].filter(Boolean)
}

async function fetchModule(slug: string): Promise<Record<string, unknown> | null> {
  const url = `${MODULE_API}/${encodeURIComponent(slug)}`
  try {
    const response = await fetch(url)
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Module API ${response.status}`)
    const data = await response.json() as Record<string, unknown>
    return data.error === true ? null : data
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) return null
    throw error
  }
}

export default defineTool({
  description: 'Display a Nuxt module card with install command. Use this tool when the user asks about installing, using, or recommending a specific Nuxt module. The card shows the module icon, description, stats, and a copy-able install command. Prefer catalog slugs when known (e.g. "hub" for NuxtHub / @nuxthub/core, "pinia" for Pinia).',
  inputSchema: z.object({
    name: z.string().describe('Module slug (e.g. "pinia", "i18n", "hub" for NuxtHub)')
  }),
  async execute({ name }) {
    let data: Record<string, unknown> | null = null

    for (const slug of slugCandidates(name)) {
      data = await fetchModule(slug)
      if (data) break
    }

    if (!data) {
      return { error: `Module "${name}" not found` }
    }

    const catalogName = data.name
    if (typeof catalogName !== 'string' || !catalogName.trim()) {
      return { error: `Module "${name}" returned an invalid response` }
    }

    const stats = data.stats as Record<string, unknown> | undefined

    return {
      name: catalogName,
      npm: data.npm as string,
      description: data.description as string,
      icon: data.icon as string,
      category: data.category as string,
      repo: data.repo as string,
      website: data.website as string,
      downloads: stats?.downloads as number | undefined,
      stars: stats?.stars as number | undefined
    }
  }
})
