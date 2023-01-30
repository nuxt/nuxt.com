import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { FilterItem } from './utils'

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
export interface Agency extends ParsedContent {
  title: string
  description: string
  _path: string
  logo: {
    light: string
    dark: string
  }
  regions: FilterItem[]
  services: FilterItem[]
  location: FilterItem
}

export interface AgencyPage extends Agency{
  link: string,
  logoFull: string,
  fullDescription: string,
  resources: {
    name: string,
    url: string
  }[]
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
  sponsorable?: boolean
  rank?: number
}

export interface NuxtJob {
  title: string
  link: string
  description: string
  remote: string
  locations: string[]
  organization: {
    name: string
    avatar: string
  }
  published_at: string
}
export interface Contributors {
  name: string
  link: string
}
