const validTeams = ['ecosystem', 'core']
export default cachedEventHandler(async (event) => {
  const contributors = await $fetch('/contributors')
  const teamName = getRouterParam(event, 'slug')
  if (!teamName || !validTeams.includes(teamName)) {
    return createError({
      statusCode: 404,
      message: 'Not Found'
    })
  }

  const members = await github.fetchTeam('nuxt', teamName)

  members.forEach((member) => {
    const contributor = contributors.find(c => c.username === member.login)
    if (contributor) {
      // @ts-expect-error not typed by GitHub call
      member.score = contributor.score || 0
    }
  })

  // @ts-expect-error not typed above
  return members.sort((a, b) => b.score - a.score)
}, {
  name: 'teams',
  shouldBypassCache: () => !!import.meta.dev,
  getKey: event => 'teams-' + getRouterParam(event, 'slug'),
  maxAge: 60 * 60 // 1 hour
})
