import { getAgentSiteUrl } from '#agent-discovery'

export default defineCachedEventHandler(async (event) => {
  const domain = getAgentSiteUrl(event)
  const { modules } = await event.$fetch('/api/v1/modules')
  modules.sort((a, b) => (b.stats?.downloads || 0) - (a.stats?.downloads || 0))

  const lines: string[] = [
    '# Nuxt Modules',
    '',
    `> ${modules.length}+ modules to supercharge your [Nuxt](https://nuxt.com) project.`,
    ''
  ]

  const sections = new Map<string, typeof modules>([['Official', []]])
  for (const mod of modules) {
    const section = mod.type === 'official' ? 'Official' : mod.category || 'Uncategorized'
    if (!sections.has(section)) sections.set(section, [])
    sections.get(section)!.push(mod)
  }

  for (const [category, mods] of sections) {
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
