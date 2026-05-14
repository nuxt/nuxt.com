export interface ModuleCardData {
  name: string
  npm?: string
  description?: string
  icon?: string
  category?: string
  repo?: string
  website?: string
  downloads?: number
  stars?: number
}

export interface TemplateCardData {
  name: string
  slug: string
  description?: string
  repo?: string
  demo?: string
  badge?: string
  purchase?: string
}

export interface BlogCardData {
  title: string
  description?: string
  path: string
  date?: string
  image?: string
  category?: string
  authors?: Array<{ name: string, avatar?: string }>
}

export interface HostingCardData {
  title: string
  description?: string
  path: string
  logoSrc?: string
  logoIcon?: string
  category?: string
  nitroPreset?: string
  website?: string
}

export interface PlaygroundCardData {
  url: string
  repo: string
  title?: string
  file?: string
  dir?: string
}
