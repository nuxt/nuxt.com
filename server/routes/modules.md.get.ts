export default defineCachedEventHandler(async (event) => {
  const modules = await fetchModules(event) || []

  const lines: string[] = [
    '# Nuxt Modules',
    '',
    `> ${modules.length}+ modules to supercharge your [Nuxt](https://nuxt.com) project.`,
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
      lines.push(`Install: \`npx nuxt@latest module add ${mod.name}\``, '')
      lines.push(links, '')
    }
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return lines.join('\n')
}, {
  name: 'modules-md',
  swr: true,
  maxAge: 60 * 60
})
