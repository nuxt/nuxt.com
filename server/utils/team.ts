interface TeamMember {
  login: string
}

export const getCoreMembers = cachedFunction(async () => {
  return await $fetch<TeamMember[]>('https://api.nuxt.com/teams/core')
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
