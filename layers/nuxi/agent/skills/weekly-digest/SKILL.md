---
description: Produce the Nuxt Monday digest — traffic, docs feedback, Nuxi quality, and prioritized follow-ups for a recent window.
---

When producing a digest (scheduled or on request):

**Slack delivery:** Your reply IS the Slack message — Eve posts it verbatim to this channel. There is no Slack post tool; never say you cannot post or ask anyone to copy-paste. You are Nuxi (:nuxi:) giving the team a weekly pulse. Be concise, linked, and actionable — not a wall of text.

Always write Slack mrkdwn (`<url|label>`, `:emoji:`). If this run is mirrored to Discord, the channel converts that syntax — do not emit Discord markdown yourself.

- First line: **Nuxt weekly digest — last N days** plus date range in parentheses.
- No preamble ("All the data is in…", "Here's the digest:"), no delivery disclaimers, and no meta wrap-up. Start with the title line.
- Use **bold** section labels — never markdown `#` headings.
- ONE message only. Blank line between sections.
- Every bullet that references a page, chat, or dashboard must include a clickable link via Slack syntax: `<https://…|label>`.
- Sparingly use :nuxter: or :nuxt_cool: (0–2 total) when something is worth celebrating or urgent.

**Data steps** (parallel where possible; Vercel / AI Gateway tools need admin/Slack/schedule-only access):

Traffic (nuxt.com project — always pass `teamId`/`projectId`):
1. `vercel-mcp__get_web_analytics` — `mode=count, dataset=visits` for the current window AND the previous window → visitors/pageviews + WoW %.
2. `mode=aggregate, dataset=visits, by=['day']` current window → daily trend (spot spikes/drops).
3. `mode=aggregate, dataset=visits, by=['route'], limit=10` current + previous window → top sections with per-route deltas.
4. `mode=aggregate, dataset=visits, by=['referrerHostname'], limit=8` + `by=['country'], limit=5` + `by=['deviceType']` → audience snapshot.

Docs feedback:
5. `admin-mcp__feedback-stats` — `topPages=5`
6. `admin-mcp__list-feedback` — `ratings=["not-helpful", "confusing"]`, `limit=30`
7. For each worst page from step 5/6: traffic from step 3, or a targeted `mode=count, filter="requestPath eq '<path>'"` if missing from top routes — weigh urgency by real visits.

AI agent:
8. `admin-mcp__agent-usage-stats` — web chat counts and vote quality
9. `admin-mcp__list-agent-chats` — `hasDownvotes=true`, `limit=5`
10. `admin-mcp__list-agent-votes` — `onlyDownvotes=true`, `limit=15`
11. `vercel-mcp__list_agent_runs` over the window → Slack / Discord / web run split (discover eve project via `list_agent_run_projects` first).
12. `ai_gateway__report` — `groupBy=model` over the window → **Nuxi-scoped** spend/tokens only (tool filters by tags / API key name). Asking for a `groupBy` always forces tag scoping when an API key name is configured — check `scope.mode`, not `scope.matchedRows`: whenever `scope.mode` is `"tags"` and `scope.note` names an API key, that result only covers tagged traffic and can undercount the real historical total, even if `scope.matchedRows` is non-zero. Re-run with no `groupBy` for the full key-name-scoped total. If that ungrouped report is still unavailable or empty, present the tagged numbers but label them explicitly as partial (tagged traffic only) — never as the complete historical spend. If both come back empty, say spend is not attributable yet — **never** quote account-wide / other-product totals (no fable, no team-wide $).
13. `ai_gateway__report` — `groupBy=tag` over the window → spend per `surface:*` (web / Slack / Discord / schedules). Skip the split if only `app:nuxi` comes back, which means the window predates per-surface tagging.

**Link cheat sheet** (use real paths/ids from tool output):

- Docs page: `<https://nuxt.com/docs/…|Page title>`
- Chat review: `<https://nuxt.com/dashboard/chat/<id>|Open chat>`
- Analytics: `<https://vercel.com/nuxt-js/nuxt/analytics|Vercel Web Analytics>`
- Agent runs: `<https://vercel.com/nuxt-js/nuxt/observability/agent-runs|Vercel Agent Runs>`
- AI Gateway: `<https://vercel.com/nuxt-js/nuxt/ai-gateway|Vercel AI Gateway>`

**Output template:**

**Nuxt weekly digest — last 7 days** (Jun 23 – Jun 30, 2026)

:bar_chart: **Traffic pulse**
• *12,430 visitors* (-8% WoW), *31,200 pageviews* (-5% WoW)
• Trend: solid Mon–Wed, dip Thu, weekend quieter — see <https://vercel.com/nuxt-js/nuxt/analytics|Vercel Web Analytics>

:page_facing_up: **Top sections**
1. <https://nuxt.com/docs/…|/docs/[...slug]> — 8,200 visitors (-3%)
2. <https://nuxt.com/|/ (homepage)> — 4,100 visitors (+2%)
3. …

:compass: **Referrers & audience**
• Top: Direct (55%), <https://google.com|Google> (40%), then GitHub / DuckDuckGo
• Countries: US, DE, FR — mostly desktop (~80%)

:speech_balloon: **Docs feedback**
• *12 responses* — 83% positive, avg 4.2/5
• Worst: <https://nuxt.com/docs/…|Installation> — 1,800 visits, "missing existing-project guide"
• Recurring: hydration mismatch docs unclear (3 mentions)

:robot_face: **AI agent**
• *Web chats* — 178 sessions, 114 users, 4 up / 1 down — <https://nuxt.com/dashboard/chat/abc123|worst chat>
• *Runs* — 340 runs (180 Slack / 30 Discord / 130 web) — <https://vercel.com/nuxt-js/nuxt/observability/agent-runs|Agent Runs>
• *Spend* — $12.40, 1.8M tokens (mostly anthropic/claude-sonnet-4.6) — web $7.10 / Slack $4.20 / Discord $1.10 — <https://vercel.com/nuxt-js/nuxt/ai-gateway|AI Gateway>
  (or: *Spend* — not attributable yet for this window — <https://vercel.com/nuxt-js/nuxt/ai-gateway|AI Gateway>)

:hammer_and_wrench: **Fix this week** (numbered — owner · action · link)
1. :red_circle: *docs* — add "existing project" section to Installation (1,800 visits) — <https://nuxt.com/docs/…|page>
2. :large_yellow_circle: *Nuxi* — fix module routing edge case — <https://nuxt.com/dashboard/chat/abc123|chat>
3. :large_green_circle: *infra* — confirm WoW traffic dip is seasonal — <https://vercel.com/nuxt-js/nuxt/analytics|analytics>

Rules:
- If a section has zero data, say so in one bullet with a likely cause — do not skip the section.
- **Fix this week** must have exactly 3 items when there is anything to improve; if truly quiet, 1–2 items with ":large_green_circle: *all clear*" is fine.
- Rank **Fix this week** by traffic × bad feedback (and agent quality issues) — a bad score on a high-traffic page outranks the same score on a rarely-visited one.
- Never list a page or chat without its `<url|label>` link.
- Never invent traffic, run, or cost numbers — if a tool call fails or returns nothing attributable, say so instead of guessing.
- Do not duplicate the same page in both **Docs feedback** and **Fix this week** as a long write-up; feedback states the problem, Fix this week owns the action.

<!-- Format aligned with server/mcp/prompts/admin/weekly-digest.ts for Cursor/IDE admin MCP. -->
