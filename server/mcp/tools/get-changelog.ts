import { z } from 'zod'

export default defineMcpTool({
  description: `Retrieves the latest releases from Nuxt core and official modules (changelog).

WHEN TO USE: Use this tool when users ask about:
- "What's new in Nuxt?" - latest releases and changes
- "What changed in Nuxt UI v3?" - specific module updates
- "Show me recent bug fixes" - browse recent changelogs
- "What version of nuxt/content was just released?" - check latest versions
- "Changelog for Nuxt" - general changelog queries

Covers repositories: nuxt/nuxt, nuxt/ui, nuxt/content, nuxt/image, nuxt/fonts, nuxt/devtools, nuxt/scripts, nuxt/eslint, nuxt/icon, nuxt/hints, nuxt/test-utils, nuxt-content/nuxt-studio.

OUTPUT: Returns releases with title, repo, tag, date, and raw markdown body. Optionally filter by repository name.`,
  inputSchema: {
    repo: z.string().optional().describe('Filter by repository (e.g., "nuxt/ui", "nuxt/nuxt"). If omitted, returns releases from all repos.'),
    limit: z.number().min(1).max(50).default(20).describe('Number of releases to return (default: 20, max: 50)')
  },
  annotations: {
    readOnlyHint: true
  },
  cache: '1h',
  async handler({ repo, limit }) {
    const releases = await fetchRawReleases() || []

    const filtered = repo
      ? releases.filter(r => r.repo === repo || r.repo.endsWith(`/${repo}`))
      : releases

    if (filtered.length === 0) {
      return errorResult(repo ? `No releases found for repository "${repo}"` : 'No releases found')
    }

    return jsonResult(filtered.slice(0, limit).map(r => ({
      title: r.title,
      repo: r.repo,
      tag: r.tag,
      date: r.date,
      url: r.url,
      markdown: r.markdown
    })))
  }
})
