import { tool } from 'ai'
import { z } from 'zod'
import type { H3Event } from 'h3'

const NUXT_ORGS = ['nuxt', 'nuxt-modules', 'nuxt-content']

interface GitHubSearchResult {
  total_count: number
  items: Array<{
    title: string
    number: number
    state: string
    html_url: string
    created_at: string
    body: string | null
    comments: number
    labels: Array<{ name: string }>
    repository_url: string
    pull_request?: unknown
  }>
}

export function createSearchGitHubIssuesTool(event: H3Event) {
  return tool({
    description: 'Search GitHub Issues across the Nuxt ecosystem (nuxt, nuxt-modules, nuxt-content orgs). Use when the user shares an error message, stack trace, or debugging question. Returns matching issues with status, labels, and body excerpts. Much faster and cheaper than web search for Nuxt-specific bugs.',
    inputSchema: z.object({
      query: z.string().describe('Error message, keyword, or search term'),
      repo: z.string().optional().describe('Scope to a specific repo (e.g. "nuxt/nuxt", "nuxt/ui"). Omit to search all Nuxt orgs.'),
      state: z.enum(['open', 'closed', 'all']).optional().describe('Filter by issue state')
    }),
    execute: async ({ query, repo, state = 'all' }) => {
      const token = useRuntimeConfig(event).github.token

      let q = query
      if (repo) {
        q += ` repo:${repo}`
      } else {
        q += ` ${NUXT_ORGS.map(org => `org:${org}`).join(' ')}`
      }
      if (state !== 'all') {
        q += ` state:${state}`
      }
      q += ' is:issue'

      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=8&sort=relevance`

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'nuxt-agent'
      }
      if (token) {
        headers['Authorization'] = `token ${token}`
      }

      try {
        const data = await $fetch<GitHubSearchResult>(url, { headers, timeout: 5000 })

        if (!data.items?.length) {
          return { total: 0, issues: [], message: 'No matching issues found.' }
        }

        return {
          total: data.total_count,
          issues: data.items.map(issue => ({
            title: issue.title,
            number: issue.number,
            repo: issue.repository_url.replace('https://api.github.com/repos/', ''),
            state: issue.state,
            labels: issue.labels.map(l => l.name),
            url: issue.html_url,
            date: issue.created_at.slice(0, 10),
            comments: issue.comments,
            body: issue.body
              ? issue.body.slice(0, 500) + (issue.body.length > 500 ? '…' : '')
              : null
          }))
        }
      } catch (error) {
        return { error: `GitHub search failed: ${(error as Error).message}` }
      }
    }
  })
}
