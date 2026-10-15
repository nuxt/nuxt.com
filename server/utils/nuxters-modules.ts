import type { H3Event } from 'h3'
import type { Module, NuxterModule, NuxterModuleLink, NuxterModules } from '#shared/types'

interface NuxterModulesIndex {
  modules: Record<string, NuxterModule>
  /** Lowercased GitHub username → module names */
  maintainers: Record<string, string[]>
  /** GitHub id → module names */
  contributors: Record<string, string[]>
}

/**
 * Who maintains and contributed to each module, built once an hour from the modules list
 * (itself cached, with the contributors of every repository): a profile is then a lookup.
 * The list of /modules (Nuxt 3+): its cache is warm, and Nuxt 2 only modules are not maintained anymore.
 */
const modulesIndex = cachedFunction(async (event: H3Event): Promise<NuxterModulesIndex> => {
  const { modules: list } = await event.$fetch<{ modules: Module[] }>('/api/v1/modules')
  const index: NuxterModulesIndex = { modules: {}, maintainers: {}, contributors: {} }
  for (const module of list) {
    if (!module.stats) continue
    const { name, description, repo, npm, icon, website, category, type, sponsor, stats } = module
    index.modules[name] = { name, description, repo, npm, icon, website, category, type, sponsor, stats }
    for (const maintainer of module.maintainers ?? []) {
      (index.maintainers[maintainer.github.toLowerCase()] ??= []).push(name)
    }
    for (const contributor of module.contributors ?? []) {
      (index.contributors[String(contributor.id)] ??= []).push(name)
    }
  }
  return index
}, {
  name: 'nuxter-modules',
  getKey: () => 'index',
  maxAge: 60 * 60,
  swr: true
})

/** The modules of a contributor. Modules are a bonus on a profile: an outage of the list returns none. */
export async function nuxterModules(event: H3Event, nuxter: { githubId: number, username: string }): Promise<NuxterModules> {
  const index = await modulesIndex(event).catch((error) => {
    console.error('[nuxters] Cannot load the modules index:', error)
    return null
  })
  if (!index) return { maintained: [], contributed: [] }

  const cards = (names: string[] = []) => names
    .map(name => index.modules[name])
    .filter((module): module is NuxterModule => !!module)
    .sort((a, b) => (b.stats?.downloads ?? 0) - (a.stats?.downloads ?? 0))

  const maintained = cards(index.maintainers[nuxter.username.toLowerCase()])
  const names = new Set(maintained.map(module => module.name))
  return {
    maintained,
    contributed: cards(index.contributors[String(nuxter.githubId)])
      .filter(module => !names.has(module.name))
      .map(({ name, npm, icon, category }): NuxterModuleLink => ({ name, npm, icon, category }))
  }
}
