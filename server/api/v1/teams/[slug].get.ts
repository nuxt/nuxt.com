const validTeams = ['ecosystem', 'core', 'ui']
export default cachedEventHandler(async (event) => {
  const contributors = await $fetch('/api/contributors')
  const teamName = getRouterParam(event, 'slug')
  if (!teamName || !validTeams.includes(teamName)) {
    return createError({
      statusCode: 404,
      message: 'Not Found'
    })
  }

  const members = await github.fetchTeam(event, 'nuxt', teamName)

  for (const member of members) {
    const contributor = contributors.find(c => c.username === member.login)
    if (contributor) {
      member.score = contributor.score || 0
    }
  }

  return members.sort((a: { score?: number }, b: { score?: number }) => (b.score || 0) - (a.score || 0))
}, {
  name: 'teams',
  shouldBypassCache: () => !!import.meta.dev,
  getKey: event => 'teams-' + getRouterParam(event, 'slug'),
  swr: true,
  maxAge: 60 * 60 // 1 hour
})
