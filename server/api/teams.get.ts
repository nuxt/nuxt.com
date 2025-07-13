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

export default defineCachedEventHandler(async () => {
  const core = await $fetch<TeamMember[]>('https://api.nuxt.com/teams/core')
  let ecosystem = await $fetch<TeamMember[]>('https://api.nuxt.com/teams/ecosystem')

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
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: () => 'teams'
})
