const config = useRuntimeConfig()

const githubHeaders = (headers = {}) => ({
  Accept: 'application/vnd.github.v3+json',
  Authorization: `token ${config.github.token}`,
  ...headers
})
// Might be used later
// const fetchGitHub = (url: string, params = {}) => {
//   return $fetch(url, {
//     baseURL: 'https://api.github.com',
//     headers: githubHeaders(),
//     params
//   })
// }
const fetchGitHubAndPaginate = async (url: string, params = {}) => {
  let data = []
  let page = 1
  let hasNext = false
  do {
    const res = await $fetch.raw(url, {
      baseURL: 'https://api.github.com',
      headers: githubHeaders(),
      params: { ...params, page }
    })
    page++
    hasNext = res.headers.get('link')?.includes('rel="next"')
    data = data.concat(res._data)
  } while (hasNext)

  return data
}

export default defineCachedEventHandler(async () => {
  // Fetch framework informations on GitHub
  // const { data: framework } = await octokit.rest.repos.get({ owner, repo })
  let stars = 0
  let repos = []
  for (const owner of ['nuxt', 'nuxt-community']) {
    repos = repos.concat(await fetchGitHubAndPaginate(`/orgs/${owner}/repos`, { type: 'public' }))
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
