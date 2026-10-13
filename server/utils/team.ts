import type { H3Event } from 'h3'
import { readGlobalConfig } from '../../layers/nuxi/agent/lib/global-config'

interface TeamMemberSearchResponse {
  data?: { organization?: { team?: { members: { nodes: { login: string }[] } } } }
}

/** Asks GitHub directly (uncached) so leaving the team takes effect immediately. */
export async function isCoreTeamMember(event: H3Event, login: string): Promise<boolean> {
  if (!useRuntimeConfig(event).github.token) {
    throw createError({ statusCode: 500, statusMessage: 'Missing NUXT_GITHUB_TOKEN env variable' })
  }

  const response = await $fetch<TeamMemberSearchResponse>('https://api.github.com/graphql', {
    method: 'POST',
    headers: githubHeaders(event),
    body: {
      query: `query($login: String!) {
        organization(login: "nuxt") { team(slug: "core") { members(query: $login, first: 10) { nodes { login } } } }
      }`,
      variables: { login }
    }
  })

  const members = response.data?.organization?.team?.members.nodes
  if (!members) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch core team members.' })
  }
  return members.some(member => member.login.toLowerCase() === login)
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

export async function isAuthorizedAdmin(event: H3Event, login: string): Promise<boolean> {
  const normalized = login.toLowerCase()
  const extraLogins = await getExtraAdminLogins()
  if (extraLogins.includes(normalized)) {
    return true
  }
  return isCoreTeamMember(event, normalized)
}
