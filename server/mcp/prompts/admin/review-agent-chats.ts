import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Review AI agent quality over a recent window: votes, worst web chats, and patterns — usage/spend via Vercel o11y.',
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).default(7).describe('Window in days (default 7).'),
    worst: z.number().int().min(1).max(20).default(5).describe('How many lowest-rated chats to read in full (default 5).')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays, worst }) {
    return `Review the Nuxt AI agent activity from the last ${sinceDays} days.

Steps to follow:
1. Call \`agent-runs-stats\` with \`sinceDays=${sinceDays}\` for runs, tokens, and breakdown by channel/trigger (slack, http, …).
2. Call \`agent-usage-stats\` with \`sinceDays=${sinceDays}\` for web chat counts and vote totals.
3. Call \`list-agent-chats\` with \`sinceDays=${sinceDays}\`, \`hasDownvotes=true\`, \`limit=${worst}\` to find the worst-rated sessions (most recently updated first).
4. For each of those ${worst} chats, call \`get-agent-chat\` with the chat \`id\` to read the full transcript and the per-message votes.
5. Optionally, call \`list-agent-votes\` with \`onlyDownvotes=true\`, \`sinceDays=${sinceDays}\`, \`limit=20\` to surface recurring downvoted answers across chats.

Produce a report with:
- **Traffic & spend** (from \`agent-runs-stats\`): sessions, tokens, triggers, recent run dashboard URLs.
- **Quality signals**: total upvotes vs downvotes, downvote rate, web chats saved in the window.
- **Worst sessions** (one bullet per chat): chat id, short summary of the user's intent, why the answer was bad (wrong, hallucinated, off-topic, refused, missing source…), and the link \`https://nuxt.com/admin/agent/<chat-id>\` if applicable.
- **Patterns**: are downvotes concentrated on certain topics (e.g. SSR, data fetching, modules) or certain phrasings?
- **Recommendations**: prompt changes, retrieval improvements, or docs gaps to fill.`
  }
})
