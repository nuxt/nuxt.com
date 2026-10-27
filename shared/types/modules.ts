import type { MarkdownDocument } from 'comark'
import type NuxtModules from '@nuxt/modules/modules.json'

/** A third-party service the module integrates with, from the `providers` field of the modules registry. */
export interface ModuleProvider {
  name: string
  label: string
  /** Iconify name, `collection:icon` */
  icon?: string
  category?: string
  docs?: string
}

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
  providers?: ModuleProvider[]
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
    /** Has a Nuxter profile (/nuxters/<github>), set by the module page API. */
    nuxter?: boolean
  }>
}

// ensure type matches the data
const _modules: BaseModule[] = [] as typeof NuxtModules

// Contributor structure from UnGH API
export interface ModuleContributor {
  id: number
  username: string
  contributions?: number
  /** Has a Nuxter profile (/nuxters/<username>), set by the module page API. */
  nuxter?: boolean
}

export interface ModuleMaintainer {
  name: string
  github: string
  twitter?: string
  bluesky?: string
  /** Has a Nuxter profile (/nuxters/<github>), set by the module page API. */
  nuxter?: boolean
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

export interface ModuleHealth {
  score: number
  color: string
  status: string
}

export interface Module extends BaseModule {
  stats?: ModuleStats
  health?: ModuleHealth | null
  contributors?: ModuleContributor[]
  maintainers?: ModuleMaintainer[]
  readme?: MarkdownDocument
  generatedAt?: string
}
