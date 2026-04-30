import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Identify the docs pages with the most negative feedback over a window and suggest concrete improvements based on what users are saying.',
  inputSchema: {
    sinceDays: z.number().int().min(7).max(365).default(30).describe('Window in days (default 30).'),
    top: z.number().int().min(1).max(20).default(5).describe('How many problematic pages to triage in depth (default 5).'),
    minResponses: z.number().int().min(1).max(50).default(3).describe('Minimum responses for a page to be considered (filters noise from pages with 1-2 votes).')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays, top, minResponses }) {
    return `Triage the most problematic Nuxt docs pages from the last ${sinceDays} days.

Steps to follow:
1. Call \`feedback-stats\` with \`sinceDays=${sinceDays}\`, \`topPages=${top}\`, \`minResponses=${minResponses}\` to get the worst-scoring pages.
2. For each of the top ${top} pages, call \`list-feedback\` with \`sinceDays=${sinceDays}\`, \`pathContains\` set to that page's path, \`ratings=["not-helpful", "confusing"]\`, \`limit=20\` to read the actual complaints from the same window.
3. If helpful, call \`get-documentation-page\` (from the public Nuxt MCP) on the same path to read the current content and ground your suggestions.

Produce a triage report with one section per page:

### <Page title> — <URL>
- **Score**: <average>/4, <negative count>/<total> negative
- **Top complaints** (3-5 bullets, paraphrased themes with example quotes)
- **Likely root cause** (e.g. missing example, ambiguous wording, outdated API, broken link)
- **Recommended action** (1-3 concrete edits, e.g. "Add a runnable example for X", "Clarify the difference between Y and Z", "Update the snippet to Nuxt 4 syntax")
- **Effort** (small / medium / large) and **expected impact** (low / medium / high)

End with a prioritized list of the top 3 actions the docs team should tackle first.`
  }
})
