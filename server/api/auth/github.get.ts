interface TeamMember {
  login: string
}

const getCoreMembers = cachedFunction(async () => {
  return await $fetch<TeamMember[]>('https://api.nuxt.com/teams/core')
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: () => 'core-members'
})

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const coreMembers = await getCoreMembers()
    if (!coreMembers) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch core team members.'
      })
    }

    const userLogin = user.login.toLowerCase()
    const coreTeamHasUser = coreMembers.some(member => member.login.toLowerCase() === userLogin)

    if (!coreTeamHasUser && userLogin !== 'hugorcd') {
      return sendRedirect(event, '/admin/login?error=access-denied')
    }

    await setUserSession(event, { user })
    return sendRedirect(event, '/admin')
  }
})
