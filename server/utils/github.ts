import type { H3Event } from 'h3'
import type { GitHubTeamMember } from '../types/github'
import type { GitHubRepository } from '#shared/types'

interface GitHubRepositoryResponse {
  id: number
  name: string
  full_name: string
  description: string
  created_at: string
  updated_at: string
  pushed_at: string
  stargazers_count: number
  watchers_count: number
  forks_count: number
  default_branch: string
}

interface GitHubTeamMemberNode {
  name: string
  login: string
  avatarUrl: string
  pronouns?: string
  location?: string
  websiteUrl?: string
  sponsorsListing?: {
    url: string
  }
  socialAccounts?: {
    edges: Array<{
      node: {
        displayName: string
        provider: string
        url: string
      }
    }>
  }
}

interface GitHubTeamResponse {
  data: {
    organization: {
      team: {
        members: {
          nodes: GitHubTeamMemberNode[]
        }
      }
    }
  }
}

export const github = {
  async fetchRepo(event: H3Event, owner: string, name: string): Promise<GitHubRepository> {
    try {
      const headers = githubHeaders(event)
      let res = await $fetch<GitHubRepositoryResponse>(`https://api.github.com/repos/${owner}/${name}`, { headers }).catch(() => null)

      if (!res) {
        // try token-less request
        res = await $fetch<GitHubRepositoryResponse>(`https://api.github.com/repos/${owner}/${name}`, { headers })
      }

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
        defaultBranch: res.default_branch
      }
    } catch (err) {
      console.error(`Cannot fetch github repo API info for ${owner}/${name}: ${err}`)
      // Cannot call Github API, fallback to UnGH
      return $fetch<{ repo: { stars: number, watchers: number, forks: number, defaultBranch: string } }>(`https://ungh.cc/repos/${owner}/${name}`)
        .then(res => res.repo)
        .catch((err) => {
          console.error(`Cannot fetch UnGH repo info for ${owner}/${name}: ${err}`)
          return {
            stars: 0,
            watchers: 0,
            forks: 0,
            defaultBranch: 'main'
          }
        })
    }
  },
  async fetchTeam(event: H3Event, org: string, teamName: string) {
    const token = useRuntimeConfig(event).github.token
    if (!token) {
      throw createError({
        statusCode: 500,
        message: 'Missing NUXT_GITHUB_TOKEN env variable'
      })
    }

    const team = await $fetch<GitHubTeamResponse>(`https://api.github.com/graphql`, {
      method: 'POST',
      headers: githubHeaders(event),
      body: {
        query: `
          query($org: String!, $team: String!) {
            organization(login: $org) {
              team(slug: $team) {
                members(first: 100) {
                  nodes {
                    name
                    login
                    avatarUrl
                    pronouns
                    location
                    websiteUrl
                    sponsorsListing {
                      url
                    }
                    socialAccounts(first: 10) {
                      edges {
                        node {
                          displayName
                          provider
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }`,
        variables: {
          org,
          team: teamName
        }
      }
    })

    return team.data.organization.team.members.nodes.map((member): GitHubTeamMember => {
      return {
        name: member.name,
        login: member.login,
        avatarUrl: member.avatarUrl,
        pronouns: member.pronouns,
        location: member.location,
        websiteUrl: member.websiteUrl,
        sponsorsListing: member.sponsorsListing?.url,
        score: undefined,
        socialAccounts: Object.fromEntries(member.socialAccounts?.edges.map(edge => [
          edge.node.provider.toLowerCase(),
          {
            displayName: edge.node.displayName,
            url: edge.node.url
          }
        ]) || [])
      }
    })
  }
}

export function githubHeaders(event: H3Event, headers: Record<string, string> = {}) {
  const token = useRuntimeConfig(event).github.token
  if (!token) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_GITHUB_TOKEN env variable'
    })
  }

  return {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'nuxt-api',
    'Authorization': `token ${token}`,
    ...headers
  }
}
