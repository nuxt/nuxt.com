import type{ CommunityRepository } from '~/types'

const config = useRuntimeConfig()

const githubHeaders = (headers = {}) => ({
  Accept: 'application/vnd.github.v3+json',
  Authorization: `token ${config.github.token}`,
  ...headers
})

const fetchReposAndPaginate = async (owner: string): Promise<CommunityRepository[]> => {
  const data = []
  const first = 100
  let after = null
  let hasNext = false

  do {
    const query = `query {
      repositoryOwner(login: "${owner}") {
        repositories (first: ${first}, after: ${after ? `"${after}"` : 'null'}, privacy: PUBLIC) {
          pageInfo {
            hasNextPage
            endCursor,
            startCursor
          }
          nodes {
            name,
            description,
            stargazerCount,
            forkCount,
            url,
            updatedAt,
            createdAt,
            owner {
              login
            },
            collaborators {
              nodes {
                id
              }
            }
          }
        }
      }
    }`

    const { data: { repositoryOwner: { repositories } } } = await $fetch<{ data: any, errors: any }>('https://api.github.com/graphql', {
      method: 'POST',
      headers: githubHeaders(),
      body: { query }
    })

    hasNext = repositories.pageInfo.hasNextPage
    after = repositories.pageInfo.endCursor

    data.push(...repositories.nodes)
  } while (hasNext)

  return data
}

export default defineCachedEventHandler(async (event) => {
  const { owners } = useQuery(event)

  const repositories: CommunityRepository[] = []
  for (const owner of owners) {
    repositories.push(...await fetchReposAndPaginate(owner))
  }

  return {
    repositories
  }
}, {
  name: 'community-repositories',
  maxAge: 60 * 1000
})
