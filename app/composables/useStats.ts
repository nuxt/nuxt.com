export interface Stats {
  id: number
  name: string
  repo: string
  description: string
  createdAt: string
  updatedAt: string
  pushedAt: string
  stars: number
  watchers: number
  forks: number
  defaultBranch: string
  version: string
  monthlyDownloads: number
}

export const useStats = () => {
  return useState<Stats | null>('stats', () => null)
}
