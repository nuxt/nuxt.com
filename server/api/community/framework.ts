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
  console.log('Fetching Github...')
  // Fetch framework informations on GitHub
  const { data: framework } = await octokit.rest.repos.get({ owner, repo })
  // Fetch contributors on GitHub
  let contributors: any = await octokit.paginate(octokit.rest.repos.listContributors, { owner, repo })
  // Filter bots
  contributors = contributors.filter(contributor => contributor.type === 'User').map(c => ({
    username: c.login,
    contributions: c.contributions
  }))
  // Fetch NPM downloads (last 30 days)
  const { downloads } = await $fetch<any>(`https://api.npmjs.org/downloads/point/last-month/${packageName}`)

  return {
    url: framework.html_url,
    stats: {
      stars: framework.stargazers_count,
      contributors: contributors.length,
      downloads
    },
    contributors
  }
}, {
  name: 'framework',
  ttl: 60 * 10
})
