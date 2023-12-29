export default cachedEventHandler(async () => {
  const releases = []
  const nuxt = await fetchModuleStats({ repo: 'nuxt/nuxt', name: 'nuxt', npm: 'nuxt' })
  releases.push({
    name: 'nuxt',
    repo: 'nuxt/nuxt',
    npm: 'nuxt',
    version: nuxt.version,
    date: new Date(nuxt.publishedAt)
  })
  const cli = await fetchModuleStats({ repo: 'nuxt/cli', name: 'nuxi', npm: 'nuxi' })
  releases.push({
    name: 'nuxi',
    repo: 'nuxt/cli',
    npm: 'nuxi',
    version: cli.version,
    date: new Date(cli.publishedAt)
  })
  let modules = await fetchModules()
  modules = modules.filter(module => module.compatibility.nuxt.includes(`^3`))

  for (const module of modules) {
    const { version, publishedAt } = await fetchModuleStats(module)
    releases.push({
      name: module.name,
      repo: module.repo,
      npm: module.npm,
      version,
      date: new Date(publishedAt)
    })
  }

  // Sort by date desc
  releases.sort((a, b) => b.date.getTime() - a.date.getTime())
  return releases
}, {
  name: 'nuxt-module-releases',
  maxAge: 60 * 1000,
  shouldBypassCache: () => Boolean(import.meta.dev)
})
