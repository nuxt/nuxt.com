import { Octokit } from '@octokit/rest'
import config from '#config'
import { cachifyHandle } from '~/server/utils/cache'

const octokit = new Octokit({
  auth: `${config.github.token}`
})
const owner = 'nuxt'
const repo = 'framework'
const packageName = 'nuxt3'

export default cachifyHandle(async () => {
  console.log('Fetching framework infos...')
  // Fetch framework informations on GitHub
  const { data: framework } = await octokit.rest.repos.get({ owner, repo })
  // Fetch contributors on GitHub
  // let contributors: any = await octokit.paginate(octokit.rest.repos.listContributors, { owner, repo })
  // // Filter bots
  // contributors = contributors.filter(contributor => contributor.type === 'User').map(c => ({
  //   username: c.login,
  //   contributions: c.contributions
  // }))
  // Fetch NPM downloads (last 30 days)
  const { downloads } = await $fetch<any>(`https://api.npmjs.org/downloads/point/last-month/${packageName}`)
  // Fetch workspace stats
  const { data: workspace } = await $fetch<any>('https://app.orbit.love/api/v1/workspaces/nuxtjs', {
    headers: { Authorization: `Bearer ${config.orbit.token}` }
  })
  // Fetch Orbit members
  const { data: members } = await $fetch<any>('https://app.orbit.love/api/v1/nuxtjs/members', {
    headers: { Authorization: `Bearer ${config.orbit.token}` }
  })
  const contributors = members.map((member) => {
    const m = member.attributes
    return {
      type: member.type,
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

  return {
    url: framework.html_url,
    stats: {
      stars: framework.stargazers_count,
      members: workspace.attributes.members_count,
      activities: workspace.attributes.activities_count,
      downloads
    },
    contributors
  }
}, {
  name: 'framework',
  ttl: 60 * 1000
})
