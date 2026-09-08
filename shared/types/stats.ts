export interface GitHubRepository {
  id?: number
  name?: string
  repo?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  pushedAt?: string
  stars: number
  watchers: number
  forks: number
  defaultBranch: string
}

export type Stats = GitHubRepository & { version: string, monthlyDownloads: number }
