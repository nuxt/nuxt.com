import { parseMarkdown } from '@nuxtjs/mdc/runtime'

import type { H3Event } from 'h3'
import type { BaseModule, Module, ModuleContributor, ModuleHealth, ModuleStats } from '#shared/types'
import type { NpmDownloadStats } from '../types/npm'

export function isBot(username: string) {
  return username.includes('[bot]') || username.includes('-bot')
}

export const fetchModules = cachedFunction(async (_event: H3Event): Promise<Module[]> => {
  console.info(`Fetching modules from CDN..`)
  return await $fetch<BaseModule[]>('https://unpkg.com/@nuxt/modules@latest/modules.json')
}, {
  name: 'modules',
  getKey: _event => '_all',
  maxAge: 10 * 60 // 10 minutes
})

export async function fetchModuleStats(event: H3Event, module: BaseModule, preloadedNpmStats?: NpmDownloadStats) {
  const key = `module:stats:${module.name}`
  const cached = await kv.get<ModuleStats>(key)
  if (cached) {
    return cached
  }
  console.info(`Fetching module ${module.name} stats...`)
  const ghRepo = module.repo.split('#')[0]!
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, repo] = await Promise.all([
    npm.fetchPackage(module.npm),
    preloadedNpmStats || npm.fetchPackageStats(module.npm, 'last-month'),
    github.fetchRepo(event, owner!, name!)
      .then((repo) => {
        return {
          stars: repo.stars,
          watchers: repo.watchers,
          forks: repo.forks,
          defaultBranch: repo.defaultBranch
        }
      })
  ])
  const stats = {
    version: npmInfos?.['dist-tags']?.latest || '0.0.0',
    downloads: npmStats.downloads,
    stars: repo.stars,
    watchers: repo.watchers,
    forks: repo.forks,
    defaultBranch: repo.defaultBranch,
    publishedAt: +new Date(npmInfos?.time?.modified || Date.now()),
    createdAt: +new Date(npmInfos?.time?.created || Date.now())
  } satisfies ModuleStats
  await kv.set(key, stats, { ttl: 60 * 60 * 24 }) // cache for 1 day
  return stats
}

interface UnghContributor {
  id: number
  username: string
  contributions: number
}

interface UnghResponse {
  contributors: UnghContributor[]
}

export async function fetchModuleContributors(_event: H3Event, module: BaseModule): Promise<ModuleContributor[]> {
  const ghRepo = module.repo.split('#')[0]!
  const [owner, name] = ghRepo.split('/')
  const key = `module:contributors:${owner}:${name}`
  const cached = await kv.get<ModuleContributor[]>(key)
  if (cached) {
    return cached
  }
  console.info(`Fetching module ${module.name} contributors ...`)
  try {
    const res = await $fetch<UnghResponse>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    const contributors = res.contributors.filter(contributor => !isBot(contributor.username))
    await kv.set(key, contributors, { ttl: 60 * 60 * 24 }) // cache for 1 day
    return contributors
  } catch (err) {
    console.error(`Cannot fetch github contributors info for ${module.repo}: ${err}`)
    return []
  }
}

interface NuxtCareModuleSlim {
  name: string
  npm: string
  score: number
  status: string
  lastUpdated: string | null
}

export async function fetchBulkModuleHealth(_event: H3Event, modules: BaseModule[]): Promise<Record<string, ModuleHealth>> {
  const result: Record<string, ModuleHealth> = {}
  const uncached: BaseModule[] = []

  // Check KV cache first
  for (const module of modules) {
    const cached = await kv.get<ModuleHealth>(`module:health:${module.name}`)
    if (cached) {
      result[module.name] = cached
    } else {
      uncached.push(module)
    }
  }

  if (!uncached.length) return result

  console.info(`Fetching health for ${uncached.length} modules from nuxt.care...`)
  try {
    const query = new URLSearchParams()
    query.set('slim', 'true')
    for (const m of uncached) {
      query.append('package', m.npm)
    }
    const statusColorMap: Record<string, string> = {
      optimal: '#22c55e',
      stable: '#84cc16',
      degraded: '#eab308',
      critical: '#ef4444',
      unknown: '#6b7280'
    }
    const data = await $fetch<NuxtCareModuleSlim[]>(`https://nuxt.care/api/v1/modules?${query.toString()}`)
    for (const item of data) {
      const module = uncached.find(m => m.npm === item.npm)
      if (!module) continue
      const health: ModuleHealth = {
        score: item.score,
        color: statusColorMap[item.status] || '#6b7280',
        status: item.status
      }
      result[module.name] = health
      await kv.set(`module:health:${module.name}`, health, { ttl: 60 * 60 * 24 })
    }
  } catch (err) {
    console.error(`Cannot fetch bulk health from nuxt.care: ${err}`)
  }

  return result
}

export async function fetchModuleReadme(_event: H3Event, module: BaseModule) {
  console.info(`Fetching module ${module.name} readme ...`)
  const readme = await $fetch(`https://unpkg.com/${module.npm}/README.md`).catch(() => {
    console.warn(`Could not fetch ${module.npm}/README.md`)
    return 'Readme not found'
  }) as string

  return await parseMarkdown(readme)
}
