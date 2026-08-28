export interface GitHubTeamMember {
  name: string
  login: string
  avatarUrl: string
  pronouns?: string
  location?: string
  websiteUrl?: string
  sponsorsListing?: string
  score?: number
  socialAccounts: Record<string, {
    displayName: string
    url: string
  }>
}

/** The subset of GitHub's push payload the revalidation webhook reads. */
export interface GitHubPushCommit {
  added?: string[]
  modified?: string[]
  removed?: string[]
}

export interface GitHubPushPayload {
  ref?: string
  repository?: { full_name?: string }
  commits?: GitHubPushCommit[]
}
