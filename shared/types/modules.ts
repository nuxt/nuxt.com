import type { MDCParserResult } from '@nuxtjs/mdc'
import type NuxtModules from '@nuxt/modules/modules.json'

export type BaseModule = {
  name: string
  description: string
  repo: string
  npm: string
  icon: string
  github: string
  website: string
  learn_more: string
  category: string
  categories?: string[]
  type: string
  sponsor?: boolean
  compatibility: {
    nuxt: string
    requires?: {
      bridge?: boolean | string
    }
  }
  maintainers?: Array<{
    name: string
    github: string
    twitter?: string
    bluesky?: string
  }>
}

// ensure type matches the data
const _modules: BaseModule[] = [] as typeof NuxtModules

// Contributor structure from UnGH API
export interface ModuleContributor {
  id: number
  username: string
  contributions?: number
}

export interface ModuleMaintainer {
  name: string
  github: string
  twitter?: string
  bluesky?: string
}

export interface ModuleStats {
  version: string
  downloads: number
  stars: number
  watchers: number
  forks: number
  defaultBranch: string
  publishedAt: number
  createdAt: number
}

export interface Module extends BaseModule {
  stats?: ModuleStats
  contributors?: ModuleContributor[]
  maintainers?: ModuleMaintainer[]
  readme?: MDCParserResult
  generatedAt?: string
}
