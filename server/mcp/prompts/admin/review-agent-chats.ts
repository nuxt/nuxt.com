import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Review the AI agent chat sessions over a recent window: usage, cost, and the worst-rated conversations to read in detail.',
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).default(7).describe('Window in days (default 7).'),
    worst: z.number().int().min(1).max(20).default(5).describe('How many lowest-rated chats to read in full (default 5).')
  },
  enabled: event => isMcpAdmin(event),
  handler({ sinceDays, worst }) {
    return `Review the Nuxt AI agent activity from the last ${sinceDays} days.

Steps to follow:
1. Call \`agent-usage-stats\` with \`sinceDays=${sinceDays}\` to get the global usage, cost, token breakdown, and provider/model split.
2. Call \`list-agent-chats\` with \`sinceDays=${sinceDays}\`, \`hasDownvotes=true\`, \`limit=${worst}\` to find the worst-rated sessions (most recently updated first).
3. For each of those ${worst} chats, call \`get-agent-chat\` with the chat \`id\` to read the full transcript and the per-message votes.
4. Optionally, call \`list-agent-votes\` with \`onlyDownvotes=true\`, \`sinceDays=${sinceDays}\`, \`limit=20\` to surface recurring downvoted answers across chats.

Produce a report with:
- **Usage at a glance**: total chats, total messages, input/output tokens, estimated cost, and the top 3 (provider, model) pairs.
- **Quality signals**: total upvotes vs downvotes, downvote rate, trend if you can compare to the previous window.
- **Worst sessions** (one bullet per chat): chat id, short summary of the user's intent, why the answer was bad (wrong, hallucinated, off-topic, refused, missing source…), and the link \`https://nuxt.com/admin/agent/<chat-id>\` if applicable.
- **Patterns**: are downvotes concentrated on certain topics (e.g. SSR, data fetching, modules), certain models, or certain phrasings?
- **Recommendations**: prompt changes, retrieval improvements, model swaps, or docs gaps to fill.`
  }
})
