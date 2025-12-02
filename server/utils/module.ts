import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import type { H3Event } from 'h3'

export function isBot(username: string) {
  return username.includes('[bot]') || username.includes('-bot')
}

export const fetchModules = cachedFunction(async (_event: H3Event) => {
  logger.info(`Fetching modules from CDN..`)
  const modules: any[] = await $fetch('https://unpkg.com/@nuxt/modules@latest/modules.json')

  return modules
}, {
  name: 'modules',
  getKey: _event => '_all',
  maxAge: 10 * 60 // 10 minutes
})

export const fetchModuleStats = cachedFunction(async (event: H3Event, module: any) => {
  logger.info(`Fetching module ${module.name} stats...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, repo] = await Promise.all([
    $fetch<any>(`https://registry.npmjs.org/${module.npm}`)
      .catch((err: Error) => {
        console.error(`Cannot fetch npm info for ${module.npm}: ${err}`)
        return { }
      }),
    $fetch<any>(`https://api.npmjs.org/downloads/point/last-month/${module.npm}`)
      .catch((err: Error) => {
        console.error(`Cannot fetch npm downloads stats for ${module.npm}: ${err}`)
        return { downloads: 0 }
      }),
    github.fetchRepo(event, owner, name)
      .then((repo) => {
        return {
          stars: repo.stars,
          watchers: repo.watchers,
          forks: repo.forks,
          defaultBranch: repo.defaultBranch
        }
      })
  ])
  return {
    version: npmInfos['dist-tags']?.latest || '0.0.0',
    downloads: npmStats.downloads,
    stars: repo.stars,
    watchers: repo.watchers,
    forks: repo.forks,
    defaultBranch: repo.defaultBranch,
    publishedAt: +new Date(npmInfos.time?.modified || undefined),
    createdAt: +new Date(npmInfos.time?.created || undefined)
  }
}, {
  name: 'module-stats',
  maxAge: 60 * 60, // 1 hour
  getKey: (_event: H3Event, module: any) => module.name
})

export const fetchModuleContributors = cachedFunction(async (_event: H3Event, module: any) => {
  logger.info(`Fetching module ${module.name} contributors ...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')

  interface UnghContributor {
    username: string
  }

  interface UnghResponse {
    contributors: UnghContributor[]
  }

  return $fetch<UnghResponse>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    .catch((err: Error) => {
      console.error(`Cannot fetch github contributors info for ${module.repo}: ${err}`)
      return { contributors: [] }
    }).then(r => r.contributors.filter(contributor => !isBot(contributor.username)))
}, {
  name: 'module-contributors',
  maxAge: 24 * 60 * 60, // 24 hour
  getKey: (_event: H3Event, module: any) => module.name
})

export const fetchModuleReadme = cachedFunction(async (_event: H3Event, module: any, _shouldBypassCache: boolean = false) => {
  logger.info(`Fetching module ${module.name} readme ...`)
  const readme = await $fetch(`https://unpkg.com/${module.npm}/README.md`).catch(() => {
    logger.warn(`Could not fetch ${module.npm}/README.md`)
    return 'Readme not found'
  }) as string

  return await parseMarkdown(readme)
}, {
  name: 'module-readme',
  // maxAge: 12 * 60 * 60, // 12 hour
  maxAge: 5, // 12 hour
  getKey: (_event: H3Event, module: any) => module.name,
  shouldBypassCache(_module, shouldBypassCache = false) {
    return shouldBypassCache
  }
})
