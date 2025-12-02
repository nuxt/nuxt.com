import type { GitHubTeamMember } from '../types/github'

const getCoreMembers = cachedFunction((): Promise<GitHubTeamMember[]> => $fetch<GitHubTeamMember[]>('/api/v1/teams/core'), {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  getKey: () => 'core-members'
})

export async function isCoreTeamMember(login: string): Promise<boolean> {
  const coreMembers = await getCoreMembers()
  if (!coreMembers || !Array.isArray(coreMembers)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch core team members.'
    })
  }
  return coreMembers.some(member => member.login.toLowerCase() === login)
}
