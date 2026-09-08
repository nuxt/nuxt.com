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

Traffic (nuxt.com project — always pass `teamId`/`projectId` via `search_vercel_endpoints` then `call_vercel_endpoint`, GET only):
1. `GET /v1/query/web-analytics/visits/count` for the current window AND the previous window → visitors/pageviews + WoW %.
2. `GET /v1/query/web-analytics/visits/aggregate` with `by=['day']` current window → daily trend (spot spikes/drops).
3. Same aggregate with `by=['route'], limit=10` current + previous window → top sections with per-route deltas.
4. Same aggregate with `by=['referrerHostname'], limit=8` + `by=['country'], limit=5` + `by=['deviceType']` → audience snapshot.

Agent-facing usage (Vercel Observability — the only allowed POST is the read-only `POST /v2/observability/query`):
- Complete every required query below. A per-call batch or concurrency limit is not a total-query limit: continue with another `call_vercel_endpoint` batch until all required results are collected. Never omit a metric because the first batch is full.
- Required totals:
  1. Nuxt `/mcp`, current and previous equal-length windows.
  2. Nuxt UI `/mcp`, current and previous equal-length windows.
  3. For **each** project, explicit Markdown in the current window: `endswith(request_path, '.md') and environment eq 'production'`.
  4. For **each** project, negotiated Markdown in the current window: `contains(http_accept, 'text/markdown') and environment eq 'production'`.
  5. For **each** project, discovery/intake in the current window: `(request_path eq '/llms.txt' or request_path eq '/llms-full.txt' or request_path eq '/sitemap.md' or request_path eq '/openapi.json' or request_path eq '/.well-known/mcp/server-card.json') and environment eq 'production'`.
- Required detail queries after the totals:
  - For **each** MCP project, group the current window by `client_user_agent` (limit 25), then by `request_method` + `http_status` (limit 20).
  - For **each** project, group explicit Markdown by `request_path` (limit 5).
  - For **each** project, group discovery/intake by `request_path` (limit 5).
- Use the ungrouped `summary` as the authoritative total. Do not derive a total by adding grouped rows or timeseries buckets.
- From the returned user-agent rows, show at most five recognized product rows with their exact counts, then at most three generic HTTP-stack rows, then the empty-user-agent row when present. Do not sum version/integration variants in the model. Never attribute a generic or empty user agent to a named agent.
- Treat `claude-code`, `codex-mcp-client`, `Cursor`, `opencode`, and `WorkBuddy` as named product rows. Generic stacks include `undici`, `node`, `Go-http-client`, `python-httpx`, and similar libraries. If the named-product cap is full, omit additional named rows; never move them into the generic list.
- Present exact method/status rows under three labels without category totals or equations: successful POST (`200`, `202`), protocol noise (`GET/HEAD 405`), and POST errors (`4xx/5xx`). Mention another row only when materially large or actionable.
- A response with `truncated: true` or `truncation.omittedArrayItems` means the tool shortened the returned timeseries; it does **not** prove a source-data gap. Never report those omitted rows as missing traffic. Use the ungrouped summary for totals and comparisons.
- Only label a real data gap when the API explicitly reports one after truncation is ruled out. Avoid causal claims about rises or falls unless a grouped result supports them.
- These are HTTP requests, not logical tool calls, sessions, or unique agents.

Agent-facing output contract:
- Start this section directly with `*Nuxt*`; do not announce completed tasks, batches, or collected data.
- A successful detail query must be rendered, not merely described as “collected”. The section is incomplete if it omits returned client, method/status, Markdown-path, or discovery-path values.
- Keep exactly two project blocks in this order: `*Nuxt*`, then `*Nuxt UI*`. Never combine their clients, health, totals, or trends.
- Under both `*Nuxt*` and `*Nuxt UI*`, always render five labeled bullets: *MCP*, *Clients*, *HTTP health*, *Markdown*, and *Discovery*.
- Every bullet must contain values from the corresponding query. Do not emit placeholders such as “report…”, “see Observability”, “not separately queried”, or “included in the batch”.
- Replace every `<…>` slot in the output template with returned data or an explicit `unavailable — <concrete error>` value.
- If a required query failed after retrying, keep its bullet and write `unavailable — <concrete error>`. Do not silently omit it.
- After both complete project blocks, add `:mag: **What stands out**` with up to three concise observations. Each observation must cite the specific returned value or comparison that supports it. Prefer meaningful cross-project differences, changes, errors, or top returned paths; skip weak observations instead of filling space.
- Top-N grouped rows are partial. Describe them as “top returned paths/clients”; never claim they represent all or most traffic unless their displayed counts are compared with the authoritative total and actually support that share.
- HTTP request volume does not establish demand, adoption, unique agents, or intentional workflow behavior. Avoid claims such as “structurally higher”, “confirms agents are…”, “working as designed”, or “growing” unless the queried data directly establishes them across a sufficient period.
- Keep factual bullets compact. Do not add per-version arithmetic, speculative attribution (including guesses about empty user agents), query-progress narration, or separators between every bullet.
- Put interpretation and one short caveat after both complete project blocks.

Docs feedback:
5. `admin-mcp__feedback-stats` — `topPages=5`
6. `admin-mcp__list-feedback` — `ratings=["not-helpful", "confusing"]`, `limit=30`
7. For each worst page from step 5/6: traffic from step 3, or a targeted `GET /v1/query/web-analytics/visits/count` with `filter="requestPath eq '<path>'"` if missing from top routes — weigh urgency by real visits.

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

:satellite: **Agent-facing usage**
*Nuxt*
• *MCP* — `<current>` HTTP requests (`<delta>` vs `<previous>`)
• *Clients* — named: `<product + count list>` · generic stacks: `<stack + count list>`
• *HTTP health* — success: POST 200 `<count>`, POST 202 `<count>` · noise: GET 405 `<count>`, HEAD 405 `<count>` · errors: POST 400 `<count>`, other POST 4xx/5xx `<status + count list>`
• *Markdown* — `<count>` explicit `.md` · `<count>` negotiated `Accept: text/markdown` (may overlap) · top paths: `<path + count list>`
• *Discovery* — `<total>` · `<path + count list>`

*Nuxt UI*
• *MCP* — `<current>` HTTP requests (`<delta>` vs `<previous>`)
• *Clients* — named: `<product + count list>` · generic stacks: `<stack + count list>`
• *HTTP health* — success: POST 200 `<count>`, POST 202 `<count>` · noise: GET 405 `<count>`, HEAD 405 `<count>` · errors: POST 400 `<count>`, other POST 4xx/5xx `<status + count list>`
• *Markdown* — `<count>` explicit `.md` · `<count>` negotiated `Accept: text/markdown` (may overlap) · top paths: `<path + count list>`
• *Discovery* — `<total>` · `<path + count list>`

:mag: **What stands out**
• `<up to three evidence-backed observations; omit this bullet rather than inventing one>`

• _Counts are HTTP requests, not tool calls, sessions, or unique agents._

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
- If a section has zero data, say so in one bullet. Give a cause only when a tool result establishes it; otherwise say no data was returned.
- **Fix this week** must have exactly 3 items when there is anything to improve; if truly quiet, 1–2 items with ":large_green_circle: *all clear*" is fine.
- Rank **Fix this week** by traffic × bad feedback (and agent quality issues) — a bad score on a high-traffic page outranks the same score on a rarely-visited one.
- Never list a page or chat without its `<url|label>` link.
- Never invent traffic, run, or cost numbers — if a tool call fails or returns nothing attributable, say so instead of guessing.
- Do not duplicate the same page in both **Docs feedback** and **Fix this week** as a long write-up; feedback states the problem, Fix this week owns the action.
- For a section-only request, return the rendered section itself. Never replace it with query coverage, compliance notes, completed-task counts, or a description of the data collected.
- Before sending an Agent-facing usage section, verify that both project headings and all ten required factual bullets are present. If not, rewrite it before responding.

<!-- Format aligned with server/mcp/prompts/admin/weekly-digest.ts for Cursor/IDE admin MCP. -->
