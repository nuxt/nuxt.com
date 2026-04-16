import { tool } from 'ai'
import { z } from 'zod'
import type { UIToolInvocation } from 'ai'
import { FetchError } from 'ofetch'

export type ShowModuleUIToolInvocation = UIToolInvocation<typeof showModuleTool>

const MODULE_API = 'https://api.nuxt.com/modules'

/** Try alternate slugs (e.g. NuxtHub → `hub`). */
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
    const data = await $fetch<Record<string, unknown>>(url)
    return data.error === true ? null : data
  } catch (e) {
    if (e instanceof FetchError && e.statusCode === 404) return null
    throw e
  }
}

export const showModuleTool = tool({
  description: 'Display a Nuxt module card with install command. Use this tool when the user asks about installing, using, or recommending a specific Nuxt module. The card shows the module icon, description, stats, and a copy-able install command. Prefer catalog slugs when known (e.g. "hub" for NuxtHub / @nuxthub/core, "pinia" for Pinia).',
  inputSchema: z.object({
    name: z.string().describe('Module slug (e.g. "pinia", "i18n", "hub" for NuxtHub)')
  }),
  execute: async ({ name }) => {
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
