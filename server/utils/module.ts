import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { satisfies } from 'semver'
import type { H3Event } from 'h3'
import type { BaseModule, Module, ModuleContributor, ModuleHealth, ModuleStats } from '#shared/types'
import type { NpmDownloadStats } from '../types/npm'

export function isBotUsername(username: string) {
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

export async function fetchModuleStats(event: H3Event, module: BaseModule, preloadedNpmStats?: NpmDownloadStats): Promise<ModuleStats> {
  const key = `module:stats:${module.name}`
  const cached = await kv.get<ModuleStats>(key)
  if (cached) {
    return cached
  }
  console.info(`Fetching module ${module.name} stats...`)
  try {
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
  } catch (err) {
    console.error(`Failed to fetch stats for module ${module.name}: ${err}`)
    return {
      version: '0.0.0',
      downloads: 0,
      stars: 0,
      watchers: 0,
      forks: 0,
      defaultBranch: 'main',
      publishedAt: Date.now(),
      createdAt: Date.now()
    } satisfies ModuleStats
  }
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
    const contributors = res.contributors.filter(contributor => !isBotUsername(contributor.username))
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

  const CHUNK_SIZE = 50
  const statusColorMap: Record<string, string> = {
    optimal: '#22c55e',
    stable: '#84cc16',
    degraded: '#eab308',
    critical: '#ef4444',
    unknown: '#6b7280'
  }
  const npmToModule = new Map(uncached.map(m => [m.npm, m]))

  console.info(`Fetching health for ${uncached.length} modules from nuxt.care (${Math.ceil(uncached.length / CHUNK_SIZE)} chunks)...`)
  for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
    const chunk = uncached.slice(i, i + CHUNK_SIZE)
    try {
      const query = new URLSearchParams()
      query.set('slim', 'true')
      for (const m of chunk) {
        query.append('package', m.npm)
      }
      const data = await $fetch<NuxtCareModuleSlim[]>(`https://nuxt.care/api/v1/modules?${query.toString()}`, {
        timeout: 10_000,
        retry: 2,
        retryDelay: 1000
      })
      for (const item of data) {
        const module = npmToModule.get(item.npm)
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
      console.error(`Cannot fetch bulk health from nuxt.care (chunk ${Math.floor(i / CHUNK_SIZE) + 1}): ${err}`)
    }
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

type NuxtCompatibilityVersion = '2' | '2-bridge' | '3' | '4' | 'all'

const nonLegacyNuxtVersions = ['3', '4'] as const

/**
 * Evaluates whether a module is compatible with a requested Nuxt target version.
 * If no version is specified, it checks for compatibility with non-legacy Nuxt versions,
 *
 * @template TModule The type of module to check compatibility for.
 * @param targetModule The module metadata containing compatibility constraints.
 * @param requestedVersion The optional target Nuxt version to test against.
 * @returns True if the module satisfies the version compatibility requirement, otherwise false.
 */
export function isModuleCompatibleWithVersion<TModule extends BaseModule>(targetModule: TModule, requestedVersion?: NuxtCompatibilityVersion): boolean {
  if (!targetModule.compatibility?.nuxt) {
    return false
  }

  if (requestedVersion === 'all') {
    return true
  }

  // If a specific Nuxt version was requested, test that version against the module's compatibility range.
  if (requestedVersion) {
    let targetVersion: string

    if (requestedVersion === '2-bridge') {
      // Reject modules that explicitly exclude bridge compatibility.
      if (!targetModule.compatibility.requires?.bridge) {
        return false
      }

      // Assign it highest possible 2.x version.
      targetVersion = '2.999.999'
    } else {
      // Assign it highest possible patch version for the requested major version.
      targetVersion = `${requestedVersion}.999.999`
    }

    return satisfies(targetVersion, targetModule.compatibility.nuxt)
  }

  // When no version is requested, consider all non-legacy Nuxt major versions.
  return nonLegacyNuxtVersions.some(version => satisfies(`${version}.999.999`, targetModule.compatibility.nuxt))
}

/**
 * Filters a collection of modules by their Nuxt version compatibility.
 *
 * @template TModule The type of modules in the list.
 * @param moduleList The array of modules to filter.
 * @param requestedVersion The optional target Nuxt version.
 * @returns A new array containing only modules compatible with the specified version.
 */
export function filterModulesByCompatibility<TModule extends BaseModule>(moduleList: TModule[], requestedVersion?: NuxtCompatibilityVersion): TModule[] {
  if (requestedVersion === 'all') {
    return moduleList
  }

  return moduleList.filter(module => isModuleCompatibleWithVersion(module, requestedVersion))
}

/**
 * Normalizes a category name by converting it to lowercase.
 * @param category The category name to normalize.
 * @returns The normalized category name.
 */
function normalizeCategory(category: string): string {
  return category.toLowerCase()
}

/**
 * Filters a collection of modules by category name (case-insensitive).
 *
 * @param moduleList The array of modules to filter.
 * @param targetCategory The optional category name to filter by.
 * @returns A filtered array matching the category, or the original list if no category is provided.
 * @template TModule The type of modules in the list.
 */
export function filterModulesByCategory<TModule extends BaseModule>(moduleList: TModule[], targetCategory?: string): TModule[] {
  if (!targetCategory) {
    return moduleList
  }

  return moduleList.filter((moduleItem) => {
    if (moduleItem.category && normalizeCategory(moduleItem.category) === normalizeCategory(targetCategory)) {
      return true
    }

    if (moduleItem.categories && Array.isArray(moduleItem.categories)) {
      return moduleItem.categories.some(category => normalizeCategory(category) === normalizeCategory(targetCategory))
    }

    return false
  })
}
