import type { GitHubTeamMember } from '../../../types/github'

export default defineCachedEventHandler(async (event) => {
  const [core, _ecosystem] = await Promise.all([
    event.$fetch<GitHubTeamMember[]>('/api/v1/teams/core'),
    event.$fetch<GitHubTeamMember[]>('/api/v1/teams/ecosystem')
  ])

  const filteredEcosystem = [] as GitHubTeamMember[]
  const coreLogins = new Set(core.map(c => c.login))

  for (const member of _ecosystem) {
    if (!coreLogins.has(member.login)) {
      filteredEcosystem.push({
        ...member,
        websiteUrl: !member.websiteUrl || member.websiteUrl.startsWith('http://') || member.websiteUrl.startsWith('https://') ? member.websiteUrl : `https://${member.websiteUrl}`
      })
    }
  }

  return {
    core,
    ecosystem: filteredEcosystem
  }
}, {
  name: 'teams',
  swr: true,
  maxAge: 60 * 60 // 1 hour
})
