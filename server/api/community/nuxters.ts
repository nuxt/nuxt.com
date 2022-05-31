const config = useRuntimeConfig()

const fetchOrbitAndPaginate = async (url: string, { headers = {}, params = {}, maxPage = 0 } = {}) => {
  let data = []
  let included = []
  let page = 1
  let hasNext = false
  do {
    const { _data } = await $fetch.raw<any>(url, {
      baseURL: 'https://app.orbit.love/api/v1',
      headers: {
        ...headers,
        Authorization: `Bearer ${config.orbit.token}`
      },
      params: {
        ...params,
        page
      }
    })
    page++
    hasNext = _data.links?.next
    data = data.concat(_data.data)
    included = included.concat(_data.included)
    if (maxPage && page > maxPage) {
      break
    }
  } while (hasNext)

  return { data, included }
}

export default defineCachedEventHandler(async (event) => {
  const { time, limit = 100 } = useQuery(event)

  // Fetch Orbit members
  const { data: members } = await fetchOrbitAndPaginate('/nuxtjs/members', {
    params: {
      identity: 'github',
      items: 100,
      sort: 'activities_count',
      start_date: time
    },
    maxPage: 2
  })

  const nuxters = members
    .filter(member => !member.attributes.tags.includes('bot'))
    .slice(0, Number(limit))
    .map((member) => {
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
        issues: 0,
        pullRequests: 0,
        comments: 0
      }
    })

  return nuxters
}, {
  name: 'contributors',
  maxAge: 60 * 1000
})
