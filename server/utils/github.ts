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
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'nuxt-api',
        'Authorization': `token ${process.env.NUXT_GITHUB_TOKEN}`
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
          defaultBranch: res.default_branch
        }
      })
      .catch((err) => {
        console.error(`Cannot fetch github repo API info for ${owner}/${name}: ${err}`)
        // Cannot call Github API, fallback to UnGH
        return $fetch<any>(`https://ungh.cc/repos/${owner}/${name}`)
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
      })
  },
  async fetchTeam(org: string, teamName: string) {
    if (!process.env.NUXT_GITHUB_TOKEN) {
      throw createError({
        statusCode: 500,
        message: 'Missing NUXT_GITHUB_TOKEN env variable'
      })
    }

    const team = await $fetch<{ data: { organization: { team: { members: { nodes: any[] } } } } }>(`https://api.github.com/graphql`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'nuxt-api',
        'Authorization': `token ${process.env.NUXT_GITHUB_TOKEN}`
      },
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

    return team.data.organization.team.members.nodes.map((member) => {
      return {
        name: member.name as string,
        login: member.login as string,
        avatarUrl: member.avatarUrl as string,
        pronouns: member.pronouns as string | undefined,
        location: member.location as string | undefined,
        websiteUrl: member.websiteUrl as string | undefined,
        sponsorsListing: member.sponsorsListing?.url as string | undefined,
        socialAccounts: Object.fromEntries(member.socialAccounts?.edges.map((edge: any) => [
          edge.node.provider.toLowerCase(),
          {
            displayName: edge.node.displayName,
            url: edge.node.url
          }
        ]) || []) as Record<string, { displayName: string, url: string }>
      }
    })
  }
}
