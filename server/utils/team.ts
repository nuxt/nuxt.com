import { readGlobalConfig } from '../../layers/nuxi/agent/lib/global-config'
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

function parseGithubLogins(raw: unknown): string[] {
  const values = Array.isArray(raw)
    ? raw.map(value => String(value))
    : typeof raw === 'string'
      ? raw.split(',')
      : []
  return [...new Set(values.map(value => value.trim().toLowerCase()).filter(Boolean))]
}

/** Extra admin logins: `NUXT_ADMIN_GITHUB_LOGINS` (local/preview) union Global Config `admin.githubLogins`. Env ignored in production. */
async function getExtraAdminLogins(): Promise<string[]> {
  const fromEnv = process.env.VERCEL_ENV === 'production'
    ? []
    : parseGithubLogins(process.env.NUXT_ADMIN_GITHUB_LOGINS)
  const config = await readGlobalConfig<{ admin?: { githubLogins?: string[] } }>(['admin'])
  return [...new Set([...fromEnv, ...parseGithubLogins(config.admin?.githubLogins)])]
}

export async function isAuthorizedAdmin(login: string): Promise<boolean> {
  const normalized = login.toLowerCase()
  const extraLogins = await getExtraAdminLogins()
  if (extraLogins.includes(normalized)) {
    return true
  }
  return isCoreTeamMember(normalized)
}
