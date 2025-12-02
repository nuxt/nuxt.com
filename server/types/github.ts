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
