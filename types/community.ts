import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface CommunityRepository {
  name: string
  description: string
  stargazerCount: number
  forkCount: number
  url: string
  updatedAt: string
  createdAt: string
  owner: { login: string }
  collaborators: {
    totalCount: number
    nodes: [{ id: string }]
  }
}

export interface CommunityRepositoryStats {
  count: number
  stars: number
  collaborators: number
}

export interface CommunityPartner extends ParsedContent {
  title: string
  description: string
  _path: string
  logo: {
    light: string
    dark: string
  }
  services: string[]
  location: string
}

export interface FormattedCommunityPartner extends Omit<CommunityPartner, 'services' | 'location'> {
  services: {
    key: string
    title: string
  }[]
  location: {
    key: string
    title: string
  }
}

export interface CommunityNuxter {
  id: number
  username: string
  name: string
  avatar: string
  issuesCount: number
  pullRequestsCount: number
  commentsCount: number
  activitiesCount: number
  rank?: number
}

export interface CommunityJob {
  id: number
  title: string
  description: string
  type: string
  location: string
  url: string
  company: {
    name: string
    avatar: string
  }
  published_at: {
    date: string
    for_humans: string
  }
}
