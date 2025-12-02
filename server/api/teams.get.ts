interface TeamMember {
  name: string
  login: string
  avatarUrl: string
  pronouns?: string
  location?: string
  websiteUrl?: string
  sponsorsListing?: string
  socialAccounts: Record<string, { displayName: string, url: string }>
}

export default defineEventHandler(async () => {
  const core = await $fetch<TeamMember[]>('/api/teams/core')
  let ecosystem = await $fetch<TeamMember[]>('/api/teams/ecosystem')

  ecosystem = ecosystem.filter(t => !core.some(c => c.login === t.login))
    .map((m) => {
      return {
        ...m,
        websiteUrl: !m.websiteUrl || m.websiteUrl.startsWith('http://') || m.websiteUrl.startsWith('https://') ? m.websiteUrl : `https://${m.websiteUrl}`
      }
    })

  return {
    core,
    ecosystem
  }
})
