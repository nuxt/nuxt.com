import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface ModuleUser {
  name: string
  github: string
  twitter: string
}

export interface Module {
  name: string
  description: string
  repo: string
  npm: string
  icon: string
  github: string
  website: string
  learn_more: string
  category: string
  type: string
  sponsor: boolean
  // tags: string[]
  compatibility: { nuxt: string, requires: { bridge: boolean } }
  stats: {
    version: any
    downloads: number
    stars: number
    publishedAt: number
    createdAt: number
  }
  maintainers: {
    name: string
    github: string
    twitter: string
  }[]
  contributors: {
    id: number
    username: string
    contributions: number
  }[]
  readme?: ParsedContent
}
