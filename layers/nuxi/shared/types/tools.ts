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

export interface NuxterCardData {
  username: string
  /** The GitHub display name, when set. */
  name?: string
  /** `undefined` for all time. */
  periodPhrase?: string
  rank: number
  score: number
  mergedPullRequests: number
  issues: number
  comments: number
  reactions: number
  maintainedModules: number
  contributedModules: number
  hackathons: string[]
  path: string
}

export interface PlaygroundCardData {
  url: string
  repo: string
  title?: string
  file?: string
  dir?: string
}

export interface PromptCardData {
  description: string
  prompt: string
  icon?: string
  deeplinks: {
    cursor: string
    claude: string
    claudeNeedsClipboardFallback?: boolean
  }
}
