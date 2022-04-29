import { Octokit } from '@octokit/rest'
const config = useRuntimeConfig()

const octokit = new Octokit({
  auth: `${config.github.token}`
})

export default defineCachedEventHandler(async () => {
  // Fetch framework informations on GitHub
  // const { data: framework } = await octokit.rest.repos.get({ owner, repo })
  let stars = 0
  let repos = []
  for (const owner of ['nuxt', 'nuxt-community']) {
    repos = repos.concat(await octokit.paginate(octokit.rest.repos.listForOrg, { org: owner, type: 'public' }))
    repos.forEach((repo) => {
      stars += repo.stargazers_count
    })
  }
  // Fetch contributors on GitHub
  // let contributors: any = await octokit.paginate(octokit.rest.repos.listContributors, { owner, repo })
  // // Filter bots
  // contributors = contributors.filter(contributor => contributor.type === 'User').map(c => ({
  //   username: c.login,
  //   contributions: c.contributions
  // }))
  // Fetch NPM downloads (last 30 days)
  const { downloads } = await $fetch<any>('https://api.npmjs.org/downloads/point/last-month/nuxt')
  // Fetch workspace stats
  const { data: workspace } = await $fetch<any>('https://app.orbit.love/api/v1/workspaces/nuxtjs', {
    headers: { Authorization: `Bearer ${config.orbit.token}` }
  })

  return {
    repositories: repos.length,
    stars,
    contributors: workspace.attributes.members_count,
    activities: workspace.attributes.activities_count,
    downloads
  }
}, {
  name: 'stats',
  maxAge: 60 * 1000
})
