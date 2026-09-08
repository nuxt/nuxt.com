import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Summarize user feedback on the docs over a recent window: rating distribution, worst pages, and recurring themes from negative comments.',
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).default(7).describe('How many days back to summarize (default 7).'),
    pathContains: z.string().optional().describe('Optional substring to focus on a specific docs section (e.g. "/docs/4.x", "data-fetching").')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays, pathContains }) {
    const scope = pathContains ? ` for pages matching "${pathContains}"` : ''

    return `Summarize Nuxt docs user feedback from the last ${sinceDays} days${scope}.

Steps to follow:
1. Call \`feedback-stats\` with \`sinceDays=${sinceDays}\` (and \`topPages=10\`) to get the rating distribution and the worst-scoring pages.
2. Call \`list-feedback\` with \`ratings=["not-helpful", "confusing"]\`, \`sinceDays=${sinceDays}\`${pathContains ? `, and \`pathContains="${pathContains}"\`` : ''}, \`limit=50\` to read the actual negative comments.
3. If a specific page stands out in step 1, call \`list-feedback\` again with \`sinceDays=${sinceDays}\` and \`pathContains\` set to that page to read what users say about it.

Then produce a concise report with:
- **Overall health**: total feedbacks, positive %, average score, week-over-week trend if you have a comparison.
- **Worst pages** (top 5): title, URL, negative ratio, and 1-2 representative quotes.
- **Recurring themes** in negative feedback: group similar complaints (clarity, missing examples, broken code, outdated info, etc.) with counts and example quotes.
- **Suggested actions** the docs team should consider, prioritized by impact.

Always include direct links (\`https://nuxt.com<path>\`) so the team can drill down. Keep it skimmable — bullet points and short paragraphs.`
  }
})
