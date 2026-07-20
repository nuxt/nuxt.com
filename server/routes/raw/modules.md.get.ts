import { getModuleNuxtMajors } from '#shared/utils/modules'

export default defineCachedEventHandler(async (event) => {
  const domain = getSiteUrl(event)
  const modules = await fetchModules(event) || []

  const lines: string[] = [
    '# Nuxt Modules',
    '',
    `> ${modules.length}+ modules to supercharge your [Nuxt](https://nuxt.com) project.`,
    '',
    'On the [modules catalog](https://nuxt.com/modules), filter by Nuxt major with `?version=3`, `?version=4`, or `?version=all` (default is Nuxt 3).',
    'Each card shows Nuxt 3 / Nuxt 4 badges derived from the module\'s `compatibility.nuxt` semver range in the [nuxt/modules](https://github.com/nuxt/modules) registry.',
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
      const majors = getModuleNuxtMajors(mod.compatibility?.nuxt)
      const links = [
        mod.website ? `[Docs](${mod.website})` : '',
        mod.repo ? `[GitHub](https://github.com/${mod.repo})` : '',
        `[npm](https://www.npmjs.com/package/${mod.npm})`
      ].filter(Boolean).join(' · ')

      lines.push(`### ${mod.npm}`, '')
      lines.push(mod.description, '')
      if (majors.length) {
        lines.push(`Nuxt: ${majors.map(major => String(major)).join(', ')}`, '')
      }
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
  maxAge: 60 * 60
})
