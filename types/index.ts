export interface Media {
  name: string
  alternativeText: string
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
  // eslint-disable-next-line no-use-before-define
  projects: Project[]
  code: string
}

export interface Membership {
  id: number
  role: 'owner' | 'member'
  team: Team
}

export interface GitHubUser {
  login: string,
  avatarUrl: string
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

// User connected through websockets
export interface SocketUser {
  username: string
  avatar: string
  file: string
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
  id: number
  owner: string
  name: string
  default_branch: string
  description: string
  language: string
  url: string
  private: boolean
  provider: 'github'
  provider_id: number
}

export interface Project {
  id: number
  name: string
  slug: string
  url: string
  status: 'pending' | 'ready'
  screenshot: Media
  updatedAt: string
  repository: Repository
  template: number | Template
  team: string | Team
  user: User
  baseDir: string
}

export type Root = 'content' | 'public'

export type FileStatus = 'created' | 'updated' | 'deleted' | 'renamed'

export interface File {
  type: 'file' | 'directory'
  path: string
  name?: string
  content?: string
  children?: File[]
  status: FileStatus
}

export interface Commit {
  authors: GitHubUser[],
  message: string,
  oid: string,
  shortSha: string,
  date: string
}

export interface GitHubBranch {
  name: string
}

export interface GitHubAccount {
  id: number
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
  default_branch: string
  homepage: string
}

export interface GitHubPaginationMeta {
  total: number
  limit: number
}

export interface GitHubPagination<T> {
  data: T[]
  meta: GitHubPaginationMeta
}

export interface GitHubFile {
  path: string
  mode?: string
  type: 'tree' | 'blob'
  sha?: string
  url?: string
  status?: FileStatus
  name?: string
  width?: number
  height?: number
  size?: number
  mimeType?: string
  content?: string
  oldPath?: string
}

export interface GitHubDraftFile {
  path: string
  content?: string
  new?: boolean
  oldPath?: string
  // Added only for medias
  width?: number
  height?: number
  size?: number
  mimeType?: string
}

export interface GitHubDraft {
  additions: GitHubDraftFile[]
  deletions: GitHubDraftFile[]
}
