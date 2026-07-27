import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Generate the Nuxt Monday digest — traffic, docs feedback, AI agent quality, and prioritized follow-ups.',
  inputSchema: {
    sinceDays: z.number().int().min(1).max(60).default(7).describe('Window in days (default 7).')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays }) {
    return `Produce the Nuxt admin digest for the last ${sinceDays} days.

Steps to follow (run them in parallel where possible):
1. Traffic via Vercel Web Analytics for nuxt.com: visitors/pageviews + WoW delta, daily trend, top routes with deltas, referrers/geo/device.
2. \`feedback-stats\` with \`sinceDays=${sinceDays}\`, \`topPages=5\`.
3. \`list-feedback\` with \`ratings=["not-helpful", "confusing"]\`, \`sinceDays=${sinceDays}\`, \`limit=30\`.
4. For worst feedback pages, weigh by real visit counts from step 1.
5. \`agent-usage-stats\` with \`sinceDays=${sinceDays}\`.
6. \`list-agent-chats\` with \`sinceDays=${sinceDays}\`, \`hasDownvotes=true\`, \`limit=5\`.
7. \`list-agent-votes\` with \`onlyDownvotes=true\`, \`sinceDays=${sinceDays}\`, \`limit=15\`.
8. Agent runs (Slack / Discord / web) and Nuxi-scoped AI Gateway spend if available — never quote account-wide / other-product totals.

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

## Docs feedback
- Headline numbers: total, positive %, average score.
- Worst pages (title + URL + score + traffic + 1-line takeaway).
- Recurring complaints across negative comments.

## AI agent
- Web chat quality (votes, worst chats with links).
- Runs Slack / Discord / web — [Agent Runs](https://vercel.com/nuxt-js/nuxt/observability/agent-runs).
- Nuxi-scoped spend/tokens only — [AI Gateway](https://vercel.com/nuxt-js/nuxt/ai-gateway). If not attributable, say so; never invent or use team-wide numbers.

## Fix this week
- 3 prioritized actions (traffic × feedback × agent), with owner suggestion and links.

Always include direct links so a reader can jump straight to the source. Prefer short paragraphs and bullet points; this is a digest, not a thesis.`
  }
})
