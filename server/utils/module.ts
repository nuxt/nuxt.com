import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import type { H3Event } from 'h3'
import type { BaseModule, Module, ModuleContributor, ModuleStats } from '#shared/types'

export function isBot(username: string) {
  return username.includes('[bot]') || username.includes('-bot')
}

export const fetchModules = cachedFunction(async (_event: H3Event): Promise<Module[]> => {
  logger.info(`Fetching modules from CDN..`)
  return await $fetch<BaseModule[]>('https://unpkg.com/@nuxt/modules@latest/modules.json')
}, {
  name: 'modules',
  getKey: _event => '_all',
  maxAge: 10 * 60 // 10 minutes
})

export const fetchModuleStats = cachedFunction(async (event: H3Event, module: BaseModule) => {
  logger.info(`Fetching module ${module.name} stats...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, repo] = await Promise.all([
    npm.fetchPackage(module.npm),
    npm.fetchPackageStats(module.npm, 'last-month'),
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
    version: npmInfos?.['dist-tags']?.latest || '0.0.0',
    downloads: npmStats.downloads,
    stars: repo.stars,
    watchers: repo.watchers,
    forks: repo.forks,
    defaultBranch: repo.defaultBranch,
    publishedAt: +new Date(npmInfos?.time?.modified || Date.now()),
    createdAt: +new Date(npmInfos?.time?.created || Date.now())
  } satisfies ModuleStats
}, {
  name: 'module-stats',
  maxAge: 60 * 60, // 1 hour
  getKey: (_event: H3Event, module: BaseModule) => module.name
})

interface UnghContributor {
  id: number
  username: string
  contributions: number
}

interface UnghResponse {
  contributors: UnghContributor[]
}

export const fetchModuleContributors = cachedFunction(async (_event: H3Event, module: BaseModule): Promise<ModuleContributor[]> => {
  logger.info(`Fetching module ${module.name} contributors ...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')

  try {
    const { contributors } = await $fetch<UnghResponse>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    return contributors.filter(contributor => !isBot(contributor.username))
  } catch (err) {
    console.error(`Cannot fetch github contributors info for ${module.repo}: ${err}`)
    return []
  }
}, {
  name: 'module-contributors',
  maxAge: 24 * 60 * 60, // 24 hour
  getKey: (_event: H3Event, module: BaseModule) => module.name
})

export const fetchModuleReadme = cachedFunction(async (_event: H3Event, module: BaseModule, _shouldBypassCache: boolean = false) => {
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
  getKey: (_event: H3Event, module: BaseModule) => module.name,
  shouldBypassCache(_module, shouldBypassCache = false) {
    return shouldBypassCache
  }
})
