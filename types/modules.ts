export interface ModuleUser {
  name: string
  github: string
  twitter: string
  login: string
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
  // tags: string[]
  compatibility: { nuxt: string, requires: { bridge: boolean } }
  stats: {
    downloads: number
    stars: number
    publishedAt: number
    createdAt: number
  }
  maintainers: ModuleUser[]
  contributors: ModuleUser[]
  readme?: string
}
