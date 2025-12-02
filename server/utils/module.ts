import { createShikiHighlighter, parseMarkdown } from '@nuxtjs/mdc/runtime'
import type { H3Event } from 'h3'
import type { BaseModule, Module, ModuleContributor, ModuleStats } from '#shared/types'
import type { NpmDownloadStats } from '../types/npm'
import { bundledLanguages } from 'shiki/langs'
import { bundledThemes } from 'shiki/themes'

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
  console.info(`Fetching module ${module.name} stats...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, repo] = await Promise.all([
    npm.fetchPackage(module.npm),
    preloadedNpmStats || npm.fetchPackageStats(module.npm, 'last-month'),
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
  console.info(`Fetching module ${module.name} contributors ...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')

  try {
    const { contributors } = await $fetch<UnghResponse>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    return contributors.filter(contributor => !isBot(contributor.username))
  } catch (err) {
    console.error(`Cannot fetch github contributors info for ${module.repo}: ${err}`)
    return []
  }
}

let highlighter: ReturnType<typeof createShikiHighlighter> | null = null

export async function fetchModuleReadme(_event: H3Event, module: BaseModule) {
  console.info(`Fetching module ${module.name} readme ...`)
  const readme = await $fetch(`https://unpkg.com/${module.npm}/README.md`).catch(() => {
    console.warn(`Could not fetch ${module.npm}/README.md`)
    return 'Readme not found'
  }) as string

  highlighter ||= createShikiHighlighter({
    themes: [bundledThemes['material-theme-lighter'], bundledThemes['material-theme-palenight']],
    langs: [bundledLanguages.js, bundledLanguages.jsx, bundledLanguages.json, bundledLanguages.ts, bundledLanguages.tsx, bundledLanguages.vue, bundledLanguages.css, bundledLanguages.html, bundledLanguages.bash, bundledLanguages.md, bundledLanguages.mdc, bundledLanguages.yaml, bundledLanguages.sql, bundledLanguages.diff, bundledLanguages.ini]
  })

  return await parseMarkdown(readme, {
    highlight: {
      highlighter,
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-palenight'
      }
    }
  })
}
