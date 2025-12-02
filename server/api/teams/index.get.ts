import type { GitHubTeamMember } from '../../types/github'

export default defineEventHandler(async () => {
  const [core, _ecosystem] = await Promise.all([
    $fetch<GitHubTeamMember[]>('/api/teams/core'),
    $fetch<GitHubTeamMember[]>('/api/teams/ecosystem')
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
})
