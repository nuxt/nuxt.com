export function isBot (username: string) {
  return username.includes('[bot]') || username.includes('-bot')
}

export const fetchModules = cachedFunction(async () => {
  logger.info(`Fetching modules from CDN..`)
  const modules: any[] = await $fetch('https://unpkg.com/@nuxt/modules@latest/modules.json')

  return modules
}, {
  name: 'modules',
  getKey: () => '_all',
  maxAge: 10 * 60, // 10 minutes
})

export const fetchModuleStats = cachedFunction(async (module: any) => {
  logger.info(`Fetching module ${module.name} stats...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, github] = await Promise.all([
    $fetch<any>(`https://registry.npmjs.org/${module.npm}`)
      .catch((err) => {
      // eslint-disable-next-line no-console
        console.error(`Cannot fetch npm info for ${module.npm}: ${err}`)
        return { }
      }),
    $fetch<any>(`https://api.npmjs.org/downloads/point/last-month/${module.npm}`)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Cannot fetch npm downloads stats for ${module.npm}: ${err}`)
        return { downloads: 0 }
      }),
    $fetch<any>(`https://ungh.cc/repos/${owner}/${name}`)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Cannot fetch github repo info for ${owner}/${name}: ${err}`)
        return { repo: { stars: 0 } }
      }).then(r => r.repo)
  ])
  return {
    downloads: npmStats.downloads,
    stars: github.stars,
    publishedAt: +new Date(npmInfos.time.modified || undefined),
    createdAt: +new Date(npmInfos.time.created || undefined)
  }
}, {
  name: 'module-stats',
  maxAge: 60 * 60, // 1 hour
  getKey: (module: any) => module.name
})

export const fetchModuleContributors = cachedFunction(async (module: any) => {
  logger.info(`Fetching module ${module.name} contributors ...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')

  return $fetch<any>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`Cannot fetch github contributors info for ${owner}/${name}: ${err}`)
      return { contributors: [] }
    }).then(r => r.contributors.filter((contributor: any) => !isBot(contributor.username)))
}, {
  name: 'module-contributors',
  maxAge: 24 * 60 * 60, // 24 hour
  getKey: (module: any) => module.name
})

export const fetchModuleReadme = cachedFunction(async (module: any) => {
  logger.info(`Fetching module ${module.name} readme ...`)
  const readme = await $fetch(`https://unpkg.com/${module.npm}/README.md`).catch(() => {
    logger.warn(`Could not fetch ${module.npm}/README.md`)
    return 'Readme not found'
  }) as string

  return await parseMarkdown(readme, 'readme.md')
}, {
  name: 'module-readme',
  // maxAge: 12 * 60 * 60, // 12 hour
  maxAge: 5, // 12 hour
  getKey: (module: any) => module.name
})
