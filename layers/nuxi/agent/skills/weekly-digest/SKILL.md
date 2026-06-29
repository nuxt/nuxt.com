---
description: Produce the Nuxt team digest combining docs feedback and Nuxi agent quality for a recent window.
---

When producing a digest (scheduled or on request):

1. Call admin tools in parallel where possible (default window: last 7 days unless the user or schedule specifies otherwise).
2. `admin_mcp__feedback_stats` with `topPages=5`.
3. `admin_mcp__list_feedback` with `ratings=["not-helpful", "confusing"]`, `limit=30`.
4. `admin_mcp__agent_usage_stats`.
5. `admin_mcp__list_agent_chats` with `hasDownvotes=true`, `limit=5` (worst-rated, most recently updated first).
6. `admin_mcp__list_agent_votes` with `onlyDownvotes=true`, `limit=15`.

Write ONE digest message with these sections (each ≤ 8 bullets). For Slack, use **bold** section labels — do not use markdown `#` headings:

**Nuxt weekly digest — last N days**

**Docs feedback**
- Headline numbers: total, positive %, average score.
- Top 5 worst pages (title + URL + score + 1-line takeaway).
- Top 3 recurring complaints across negative comments.

**AI agent**
- **Traffic & spend**: point to Vercel Observability → Agent Runs (runs, tokens, Slack vs web). Do not quote local DB for this.
- **Quality** (from `agent-usage-stats` + votes): upvotes vs downvotes, downvote rate, web chats saved.
- Top 3 worst web chats (id + short reason).

**What to fix this week**
- 3 prioritized actions (page edit, prompt change, retrieval fix, etc.) with owner suggestion if obvious.

Always include direct links (`https://nuxt.com<path>`, chat ids) so the team can drill down. Keep it skimmable — bullet points and short paragraphs.

<!-- Format aligned with server/mcp/prompts/admin/weekly-digest.ts for Cursor/IDE admin MCP. -->
