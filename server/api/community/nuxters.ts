const config = useRuntimeConfig()

export default defineCachedEventHandler(async () => {
  console.log('Fetching Nuxters...')
  // Fetch Orbit members
  const { data: members } = await $fetch<any>('https://app.orbit.love/api/v1/nuxtjs/members?sort=activities_count', {
    headers: { Authorization: `Bearer ${config.orbit.token}` }
  })
  const nuxters = members.filter(member => !member.attributes.tags.includes('bot')).map((member) => {
    const m = member.attributes
    return {
      name: m.name || m.github,
      bio: m.bio,
      github: m.github,
      twitter: m.twitter,
      location: m.location,
      roles: m.tags,
      firstActivity: m.first_activity_occurred_at,
      lastActivity: m.last_activity_occurred_at,
      activities: m.activities_count
    }
  })

  return nuxters
}, {
  name: 'contributors',
  ttl: 60 * 1000
})
