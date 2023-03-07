export const fetchModuleStats = cachedFunction(async (module: any) => {
  console.log(`Fetching module stats for ${module.name}...`)
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
  console.log(`Fetching module contributors for ${module.name}...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')

  return $fetch<any>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`Cannot fetch github contributors info for ${owner}/${name}: ${err}`)
      return { contributors: [] }
    }).then(r => r.contributors)
}, {
  name: 'module-contributors',
  maxAge: 24 * 60 * 60, // 24 hour
  getKey: (module: any) => module.name
})