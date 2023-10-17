export const github = {
  async fetchRepo(owner: string, name: string) {
    if (!process.env.NUXT_GITHUB_TOKEN) {
      throw createError({
        statusCode: 500,
        message: 'Missing NUXT_GITHUB_TOKEN env variable'
      })
    }
    return $fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'nuxt-api',
        Authorization: `token ${process.env.NUXT_GITHUB_TOKEN}`,
      }
    })
      .then((res: any) => {
        return {
          id: res.id,
          name: res.name,
          repo: res.full_name,
          description: res.description,
          createdAt: res.created_at,
          updatedAt: res.updated_at,
          pushedAt: res.pushed_at,
          stars: res.stargazers_count,
          watchers: res.watchers_count,
          forks: res.forks_count,
          defaultBranch: res.default_branch,
        }
      })
      .catch(err => {
        console.error(`Cannot fetch github repo API info for ${owner}/${name}: ${err}`)
        // Cannot call Github API, fallback to UnGH
        return $fetch<any>(`https://ungh.cc/repos/${owner}/${name}`)
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(`Cannot fetch UnGH repo info for ${owner}/${name}: ${err}`)
            return {
              stars: 0,
              watchers: 0,
              forks: 0,
              defaultBranch: 'main'
            }
          })
          .then(res => res.repo)
      })
  }
}