import type { GitHubTeamMember } from '../types/github'
import type { H3Event } from 'h3'

const getCoreMembers = cachedFunction((event: H3Event): Promise<GitHubTeamMember[]> => event.$fetch<GitHubTeamMember[]>('/api/v1/teams/core'), {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  getKey: () => 'core-members'
})

export async function isCoreTeamMember(event: H3Event, login: string): Promise<boolean> {
  const coreMembers = await getCoreMembers(event)
  if (!coreMembers || !Array.isArray(coreMembers)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch core team members.'
    })
  }
  return coreMembers.some(member => member.login.toLowerCase() === login)
}

function getExtraAdminLogins(event: H3Event): string[] {
  const raw = useRuntimeConfig(event).adminGithubLogins
  if (!raw) return []
  return raw
    .split(',')
    .map(login => login.trim().toLowerCase())
    .filter(Boolean)
}

export async function isAuthorizedAdmin(event: H3Event, login: string): Promise<boolean> {
  const normalized = login.toLowerCase()
  if (getExtraAdminLogins(event).includes(normalized)) {
    return true
  }
  return isCoreTeamMember(event, normalized)
}
