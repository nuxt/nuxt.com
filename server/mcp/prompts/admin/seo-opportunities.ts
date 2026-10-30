import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Find the nuxt.com pages with the most to gain from SEO work, from Google Search Console data cross-checked with docs feedback, indexing and field Core Web Vitals, and suggest concrete fixes.',
  inputSchema: {
    days: z.number().int().min(7).max(90).default(28).describe('Window in days, compared with the window just before it (default 28).'),
    top: z.number().int().min(1).max(20).default(10).describe('How many opportunities to report (default 10).'),
    pathContains: z.string().optional().describe('Only consider pages whose URL contains this, e.g. "/docs/4.x" or "/blog".')
  },
  enabled: event => isMcpAdmin(event),
  handler({ days, top, pathContains }) {
    // Serialized so quotes or backslashes in `pathContains` can't break the filter JSON or the sentence around it.
    const pageFilter = pathContains ? `, \`filters=${JSON.stringify([{ dimension: 'page', operator: 'contains', expression: pathContains }])}\`` : ''
    return `Find the top ${top} SEO opportunities on nuxt.com${pathContains ? ` for pages containing ${JSON.stringify(pathContains)}` : ''}.

Steps to follow:
1. Call \`search-console-analytics\` with \`dimensions=["page"]\`, \`rowLimit=500\`${pageFilter} for the last ${days} days (default window), then again with the ${days} days just before it (set \`startDate\` / \`endDate\`). Compare clicks per page.
2. Call \`search-console-analytics\` with \`dimensions=["page", "query"]\`, \`rowLimit=2000\`${pageFilter} for the last ${days} days.
3. From these, collect candidates in four buckets:
   - **Low CTR**: pages with many impressions and an average position of 1-5 but a CTR well below the site's own median at that position. The title or meta description likely fails to win the click.
   - **Striking distance**: page + query pairs at average position 8-20 with high impressions. Moving them to page one is the biggest traffic win.
   - **Declining**: pages that lost the most clicks compared with the previous window (absolute and %).
   - **Mismatch**: queries where Google ranks a page that does not answer them (e.g. a v3 page for a v4 query, a blog post for an API query), or several pages competing for one query.
4. For the ${top} most promising candidates, gather context:
   - \`feedback-stats\` / \`list-feedback\` with \`pathContains\` set to the page path: do readers also rate it poorly?
   - \`crux-web-vitals\` with \`url\` set to the page and \`formFactor="PHONE"\`: does it fail Core Web Vitals? (Use the origin if \`found\` is false.)
   - \`search-console-inspect-url\` for declining pages: indexing problem, wrong canonical, or a recent crawl issue?
   - \`get-documentation-page\` (public Nuxt MCP) for docs pages: read the current title, description and the sections relevant to the queries.

Produce a report with one section per opportunity, ordered by expected impact:

### <Page title> — <URL>
- **Bucket**: low CTR / striking distance / declining / mismatch
- **Data**: clicks, impressions, CTR, position (and change vs previous window); top 3-5 queries
- **Diagnosis**: why it underperforms, citing the data above (feedback, Core Web Vitals, indexing when relevant)
- **Recommended action**: 1-3 concrete edits, e.g. a rewritten title and description (write them), a section to add for a query, a redirect or canonical fix, a performance fix
- **Effort** (small / medium / large) and **expected impact** (low / medium / high)

End with the top 3 actions to tackle first. Search Console data lags ~2-3 days; mention it when comparing windows.`
  }
})
