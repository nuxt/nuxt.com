const config = useRuntimeConfig()

export default defineCachedEventHandler(async (event) => {
  const { time } = useQuery(event)

  // Fetch Orbit members
  const { data: members } = await $fetch<any>('https://app.orbit.love/api/v1/nuxtjs/members', {
    headers: { Authorization: `Bearer ${config.orbit.token}` },
    params: {
      identity: 'github',
      items: 100,
      sort: 'activities_count',
      start_date: time
    }
  })
  const nuxters = members.filter(member => !member.attributes.tags.includes('bot')).map((member) => {
    const m = member.attributes
    return {
      name: m.name || m.github,
      avatar_url: m.github ? `https://github.com/${m.github}.png` : m.avatar_url,
      bio: m.bio,
      github: m.github,
      twitter: m.twitter,
      location: m.location,
      roles: m.tags,
      role: m.tags?.length ? m.tags[0] : '',
      firstActivity: m.first_activity_occurred_at,
      lastActivity: m.last_activity_occurred_at,
      activities: m.activities_count,
      issues: Math.round(Math.random() * 1000),
      pullRequests: Math.round(Math.random() * 1000),
      comments: Math.round(Math.random() * 1000)
    }
  })

  return nuxters
}, {
  name: 'contributors',
  maxAge: 60 * 1000
})
