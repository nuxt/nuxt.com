export interface Media {
  name: string,
  alternativeText: string,
  caption: string
  ext: string
  url: string
  previewUrl: string
}

export interface Member {
  id: number
  role: 'owner' | 'member'
  // eslint-disable-next-line no-use-before-define
  user: User
}

export interface Team {
  id: number
  name: string
  slug: string
  avatar: Media
  members: Member[]
  code: string
}

export interface Membership {
  id: number
  role: 'owner' | 'member'
  team: Team
}

export interface User {
  id: number
  username: string
  name: string
  email: string
  avatar: string
  memberships: Membership[]
  beta: boolean
}

export interface Template {
  id: number
  owner: string
  name: string
  branch: string
  url: string
  title: string
  slug: string
  description: string
  screenshot: Media
}

export interface Repository {
  id: number,
  owner: string,
  name: string,
  defaultBranch: string,
  description: string,
  language: string,
  url: string,
  private: boolean,
  provider: 'github',
  providerId: number
}
export interface Project {
  id: number
  name: string,
  url: string,
  status: 'pending' | 'ready',
  screenshot: Media,
  repository: Repository,
  template: number | Template,
  team: string | Team,
  user: User
}

export interface GitHubAccount {
  login: string
  avatar_url: string
}

export interface GitHubInstallation {
  account: GitHubAccount
}

export interface GitHubRepository {
  id: number
  owner: GitHubAccount
  name: string
  private: boolean
}

export interface GitHubPaginationMeta {
  total: number
  limit: number
}

export interface GitHubPagination<T> {
  data: T[]
  meta: GitHubPaginationMeta
}
