export type FileStatus = 'created' | 'updated' | 'deleted' | 'renamed'

export interface GitHubBranch {
  name: string
  openedAt?: number
  disabled?: boolean
  icon?: string
  pull?: {
    number: number
    success: boolean
    description: string
    url: string
  }
}

export interface GitHubAccount {
  id: number
  login: string
  avatar_url: string
}

export interface GitHubCheckRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required'
}

export interface GitHubStatus {
  id: number
  context: string
  description: string
  state: 'success' | 'failure' | 'pending'
}

export interface GitHubPull {
  number: number
  state: 'open'
  body: string
  html_url: string
  user: GitHubAccount
  head: {
    label: string
    ref: string
  }
  base: {
    label: string
    ref: string
  }
  check_runs: GitHubCheckRun[]
  statuses: GitHubStatus[]
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
  forceFetch?: boolean
  openedAt?: number
  disabled?: boolean
  icon?: string
  iconClass?: string
  iconColor?: string
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
