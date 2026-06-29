import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Generate a weekly digest combining docs feedback and AI agent quality — ready to share with the Nuxt team.',
  inputSchema: {
    sinceDays: z.number().int().min(1).max(60).default(7).describe('Window in days (default 7).')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays }) {
    return `Produce the Nuxt admin digest for the last ${sinceDays} days.

Steps to follow (run them in parallel where possible):
1. \`feedback-stats\` with \`sinceDays=${sinceDays}\`, \`topPages=5\`.
2. \`list-feedback\` with \`ratings=["not-helpful", "confusing"]\`, \`sinceDays=${sinceDays}\`, \`limit=30\`.
3. \`agent-usage-stats\` with \`sinceDays=${sinceDays}\`.
4. \`list-agent-chats\` with \`sinceDays=${sinceDays}\`, \`hasDownvotes=true\`, \`limit=5\` (worst-rated, most recently updated first).
5. \`list-agent-votes\` with \`onlyDownvotes=true\`, \`sinceDays=${sinceDays}\`, \`limit=15\`.

Then write a digest in Markdown with these sections (be concise — each section ≤ 8 bullets):

# Nuxt weekly digest — last ${sinceDays} days

## Docs feedback
- Headline numbers: total, positive %, average score.
- Top 5 worst pages (title + URL + score + 1-line takeaway).
- Top 3 recurring complaints across negative comments.

## AI agent
- **Traffic & spend**: point to Vercel Observability → Agent Runs (runs, tokens, Slack vs web). Do not quote local DB for this.
- **Quality** (from \`agent-usage-stats\` + votes): upvotes vs downvotes, downvote rate, web chats saved.
- Top 3 worst web chats (id + short reason).

## What to fix this week
- 3 prioritized actions (page edit, prompt change, retrieval fix, etc.) with owner suggestion if obvious.

Always include direct links so a reader can jump straight to the source. Prefer short paragraphs and bullet points; this is a digest, not a thesis.`
  }
})
