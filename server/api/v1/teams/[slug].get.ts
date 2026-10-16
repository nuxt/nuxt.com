const validTeams = ['ecosystem', 'core', 'ui']
export default cachedEventHandler(async (event) => {
  const teamName = getRouterParam(event, 'slug')
  if (!teamName || !validTeams.includes(teamName)) {
    return createError({
      statusCode: 404,
      message: 'Not Found'
    })
  }

  const members = await github.fetchTeam(event, 'nuxt', teamName)

  // Nuxters score, to sort the team by contributions
  const scores = await nuxters.scores(members.map(member => member.login)).catch((error) => {
    console.error('Cannot load Nuxters scores:', error)
    return new Map<string, number>()
  })
  for (const member of members) {
    const score = scores.get(member.login.toLowerCase())
    if (score !== undefined) {
      member.score = score
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
