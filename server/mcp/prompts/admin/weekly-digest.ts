import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Generate the Nuxt Monday digest — traffic, Search Console and SEO opportunities, docs feedback, AI agent quality, and prioritized follow-ups.',
  inputSchema: {
    sinceDays: z.number().int().min(1).max(60).default(7).describe('Window in days (default 7).')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays }) {
    return `Produce the Nuxt admin digest for the last ${sinceDays} days.

Steps to follow (run them in parallel where possible):
1. Traffic via Vercel Web Analytics for nuxt.com: use \`count_pageviews\` and \`aggregate_pageviews\` for visitors/pageviews + WoW delta, daily trend, top routes with deltas, referrers/geo/device.
   Pass the configured Nuxt \`projectId\` and \`teamId\`; do not pass \`slug\`. For aggregates, only use buckets inside the requested half-open \`[start, end)\` window; ignore buckets introduced by API boundary rounding.
2. \`feedback-stats\` with \`sinceDays=${sinceDays}\`, \`topPages=5\`.
3. \`list-feedback\` with \`ratings=["not-helpful", "confusing"]\`, \`sinceDays=${sinceDays}\`, \`limit=30\`.
4. For worst feedback pages, weigh by real visit counts from step 1.
5. \`agent-usage-stats\` with \`sinceDays=${sinceDays}\`.
6. \`list-agent-chats\` with \`sinceDays=${sinceDays}\`, \`hasDownvotes=true\`, \`limit=5\` (shared or public chats only).
7. \`list-agent-votes\` with \`onlyDownvotes=true\`, \`sinceDays=${sinceDays}\`, \`limit=15\`.
8. Agent runs (Slack / Discord / web) and Nuxi-scoped AI Gateway spend if available — never quote account-wide / other-product totals.
9. Search Console: set the inclusive end date to today minus 3 days, start date to end minus (${sinceDays} - 1) days, and compare with the immediately preceding ${sinceDays}-day window. Pass both dates explicitly to \`search-console-analytics\`. Use \`dimensions=[]\` for authoritative totals, \`dimensions=["page"]\` for page changes, and \`dimensions=["page", "query"]\` for opportunities (high impressions at positions 8–20, low CTR among comparable positions, declining pages or intent mismatches). CTR is already a percentage. Grouped rows are partial; never sum them into site totals or treat an absent page as zero without an exact-page query. For at most 2 promising pages, read the current docs, check page-specific negative \`list-feedback\`, inspect declining URLs with \`search-console-inspect-url\` and use \`crux-web-vitals\` when relevant (origin fallback is not page evidence). Keep failures explicit and continue the rest of the digest.

Then write a digest in Markdown with these sections (be concise — each section ≤ 8 bullets):

# Nuxt weekly digest — last ${sinceDays} days

## Traffic pulse
- Visitors / pageviews + WoW %.
- One-line daily trend (spikes/drops).
- Link to [Vercel Web Analytics](https://vercel.com/nuxt-js/nuxt/analytics).

## Top sections
- Top routes with visit counts and WoW deltas (linked).

## Referrers & audience
- Top referrers, countries, device mix (short).

## Search & SEO
- Actual delayed data dates and totals vs previous equal-length window: clicks, impressions, CTR (percentage-point changes) and position (rank-point changes, lower is better).
- Up to 2 linked page recommendations backed by query metrics and current content; label hypotheses and partial data.
- Link to [Search Console](https://search.google.com/search-console). Report missing access/data here if unavailable.

## Docs feedback
- Headline numbers: total, positive %, average score.
- Worst pages (title + URL + score + traffic + 1-line takeaway).
- Recurring complaints across negative comments.

## AI agent
- Web chat quality (votes, worst chats with links).
- Runs Slack / Discord / web — [Agent Runs](https://vercel.com/nuxt-js/nuxt/observability/agent-runs).
- Nuxi-scoped spend/tokens only — [AI Gateway](https://vercel.com/nuxt-js/nuxt/ai-gateway). If not attributable, say so; never invent or use team-wide numbers.

## Fix this week
- 3 prioritized actions (traffic × feedback, evidenced SEO opportunities, and agent quality), with owner suggestion and links.

Always include direct links so a reader can jump straight to the source. Prefer short paragraphs and bullet points; this is a digest, not a thesis.`
  }
})
