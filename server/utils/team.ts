import { getAll } from '@vercel/global-config'
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

/** Extra admin logins live in Global Config (`adminGithubLogins`), editable from the Vercel dashboard with no redeploy. */
async function getExtraAdminLogins(): Promise<string[]> {
  const config = await getAll<{ adminGithubLogins?: string[] }>(['adminGithubLogins'])
  const raw = config.adminGithubLogins
  if (!Array.isArray(raw)) return []
  return raw.map(login => String(login).trim().toLowerCase()).filter(Boolean)
}

export async function isAuthorizedAdmin(login: string): Promise<boolean> {
  const normalized = login.toLowerCase()
  const extraLogins = await getExtraAdminLogins()
  if (extraLogins.includes(normalized)) {
    return true
  }
  return isCoreTeamMember(normalized)
}
