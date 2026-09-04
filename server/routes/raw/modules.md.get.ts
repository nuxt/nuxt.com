import { getAgentSiteUrl } from '#agent-discovery'
import { z } from 'zod'
import { CURRENT_NUXT_VERSION, filterModulesByNuxtVersions, getModuleCompatibility, MODULE_VERSION_VALUES } from '#shared/utils/modules'

export default defineCachedEventHandler(async (event) => {
  const domain = getAgentSiteUrl(event)
  const { version } = await getValidatedQuery(event, z.object({
    version: z.enum(MODULE_VERSION_VALUES).default(CURRENT_NUXT_VERSION)
  }).parse)
  const modules = filterModulesByNuxtVersions(await fetchModules(event) || [], [version])
  const catalogDescription = version === 'all'
    ? `${modules.length} modules across all Nuxt versions.`
    : `${modules.length} modules compatible with ${version === '2-bridge' ? 'Nuxt 2 Bridge' : `Nuxt ${version}`}.`

  const lines: string[] = [
    '# Nuxt Modules',
    '',
    `> ${catalogDescription} Nuxt 4 is the default catalog.`,
    '',
    'Choose another catalog with `?version=2`, `?version=2-bridge`, `?version=3`, `?version=5`, or `?version=all`.',
    ''
  ]

  const categories = new Map<string, typeof modules>()
  for (const mod of modules) {
    const cat = mod.category || 'Uncategorized'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(mod)
  }

  for (const [category, mods] of categories) {
    lines.push(`## ${category}`, '')
    for (const mod of mods) {
      const links = [
        mod.website ? `[Docs](${mod.website})` : '',
        mod.repo ? `[GitHub](https://github.com/${mod.repo})` : '',
        `[npm](https://www.npmjs.com/package/${mod.npm})`
      ].filter(Boolean).join(' · ')

      lines.push(`### ${mod.npm}`, '')
      lines.push(mod.description, '')
      lines.push(`Compatibility: ${getModuleCompatibility(mod.compatibility.nuxt).label} (${mod.compatibility.nuxt || 'not declared'})`, '')
      lines.push(`Install: \`npx nuxt@latest module add ${mod.name}\``, '')
      lines.push(links, '')
    }
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Link', [
    `<${domain}/modules>; rel="canonical"`,
    `<${domain}/modules>; rel="alternate"; type="text/html"`
  ].join(', '))
  return lines.join('\n')
}, {
  name: 'raw-modules-md',
  swr: true,
  getKey(event) {
    return String(getQuery(event).version || CURRENT_NUXT_VERSION)
  },
  maxAge: 60 * 60
})
