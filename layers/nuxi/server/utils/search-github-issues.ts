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
  }>
}

export async function searchGitHubIssues(
  event: H3Event,
  input: { query: string, repo?: string, state?: 'open' | 'closed' | 'all' }
) {
  const { query, repo, state = 'all' } = input
  const token = useRuntimeConfig(event).github.token

  let q = query
  if (repo) {
    q += ` repo:${repo}`
  } else {
    q += ` (${NUXT_ORGS.map(org => `org:${org}`).join(' OR ')})`
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
    headers.Authorization = `token ${token}`
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
