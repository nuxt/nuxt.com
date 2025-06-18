import type { H3Event } from 'h3'

export const getCoreMembers = cachedFunction(async () => {
  return await $fetch<{
    login: string
  }[]>('https://api.nuxt.com/teams/core')
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: () => 'core-members'
})

export async function isCoreTeamMember(login: string) {
  const coreMembers = await getCoreMembers()
  if (!coreMembers) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch core team members.'
    })
  }
  return coreMembers.some(member => member.login.toLowerCase() === login)
}

export async function requireCoreTeamUser(event: H3Event) {
  const { user } = await requireUserSession(event)
  const coreMember = await isCoreTeamMember(user.login.toLowerCase())
  if (!coreMember) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
}
