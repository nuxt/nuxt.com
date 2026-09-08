---
description: Measure Nuxt and Nuxt UI MCP traffic plus agent-facing Markdown usage with Vercel Observability.
---

Use this skill when an admin asks about MCP adoption, AI-agent traffic, raw Markdown consumption, curl usage, or which clients use Nuxt/Nuxt UI.

## Source of truth

Use `vercel-mcp__search_vercel_endpoints` to discover `POST /v2/observability/query`, then call it through `vercel-mcp__call_vercel_endpoint`.

- Metric: `vercel.request.count`
- Aggregation: `sum`
- Scope:
  - `type`: `project`
  - `ownerId`: the configured Nuxt team id
  - `projectIds`: one configured project id, Nuxt or Nuxt UI
- Always filter to `environment eq 'production'`.
- Use ISO UTC timestamps for `startTime` and `endTime`.
- Query the requested window and the immediately preceding equal-length window when a trend or comparison is useful.

## Query recipes

Run independent Nuxt and Nuxt UI queries in parallel.
A per-call batch or concurrency limit is not a total-query limit. Continue with additional `call_vercel_endpoint` batches until every requested total and detail query is complete.

1. MCP request volume:
   - Filter: `request_path eq '/mcp' and environment eq 'production'`
   - For Nuxt and Nuxt UI separately, first query the current and previous equal-length windows ungrouped for exact HTTP request counts.
   - For each project, group the current window by `client_user_agent` (limit 25), `bot_category` + `bot_name` (limit 20), and `request_method` + `http_status` (limit 20).
2. Explicit Markdown URLs on each project:
   - Filter: `endswith(request_path, '.md') and environment eq 'production'`
   - For Nuxt and Nuxt UI separately, query ungrouped, then group by `request_path` (limit 10) and `client_user_agent` (limit 10).
3. Content-negotiated Markdown on each project:
   - Filter: `contains(http_accept, 'text/markdown') and environment eq 'production'`
   - For Nuxt and Nuxt UI separately, query ungrouped, then group by `request_path` (limit 10) and `client_user_agent` (limit 10).
4. Agent discovery and intake on each project:
   - Filter: `(request_path eq '/llms.txt' or request_path eq '/llms-full.txt' or request_path eq '/sitemap.md' or request_path eq '/openapi.json' or request_path eq '/.well-known/mcp/server-card.json') and environment eq 'production'`
   - For Nuxt and Nuxt UI separately, query ungrouped, then group by `request_path` (limit 10), `client_user_agent` (limit 10), or `bot_category` + `bot_name` (limit 10).
   - Keep these separate from content reads: fetching an index or server card does not prove the client consumed a documentation page.
5. curl traffic, only when explicitly requested:
   - Filter: `contains(client_user_agent, 'curl/') and environment eq 'production'`
   - Group by `request_path` and `client_user_agent`.
   - Exclude asset paths such as `/_nuxt/`, `/_fonts/`, and image assets from the interpretation.

## Interpretation rules

- Call the result **HTTP requests**, never tool calls, sessions, users, or unique agents.
- Use the ungrouped `summary` as the authoritative total. Do not add grouped rows or timeseries buckets to reconstruct it.
- MCP initialization, `tools/list`, `tools/call`, retries, notifications, and malformed requests each count separately.
- Empty or generic user agents (`node`, `undici`, `Go-http-client`, `python-httpx`) identify a client stack, not a specific agent product.
- From the returned user-agent rows, report at most five recognized product rows with their exact counts, then at most three generic HTTP-stack rows, then the empty-user-agent row when present. Do not sum version/integration variants in the model. Never rename a generic or empty user agent as a specific agent.
- Treat `claude-code`, `codex-mcp-client`, `Cursor`, `opencode`, and `WorkBuddy` as named product rows. If the named-product cap is full, omit additional named rows; never move them into the generic list.
- Do not speculate about which products, proxies, or relays produced generic or empty user agents.
- Present exact method/status rows under successful POST (`200`, `202`), protocol noise (`GET/HEAD 405`), and POST errors (`4xx/5xx`) without category totals or equations. Mention other rows only when materially large or actionable.
- `bot_category` and `bot_name` are useful classifications but do not identify every agent. Report uncategorized and HTTP-client traffic separately.
- A curl user agent does not prove an AI agent initiated the request.
- A `.md` or `/raw/**` request does not prove AI usage either: the website's “View as Markdown” and “Copy page” actions generate those requests from normal browsers. Report browser user agents separately.
- Treat explicit `Accept: text/markdown`, known AI bot categories/names, and POST `/mcp` as strong agent signals. Discovery endpoints are strong intent signals but represent intake, not necessarily document consumption.
- Web Analytics pageviews exclude most non-browser traffic. Do not use them for MCP, curl, `.md`, or `Accept: text/markdown` usage.
- If an Observability query times out, shorten the window or remove a high-cardinality grouping. Keep the ungrouped total as the authoritative number.
- A response with `truncated: true` or `truncation.omittedArrayItems` means the tool shortened the returned timeseries; it does **not** prove a source-data gap. Never report those omitted rows as missing traffic.
- Only label a real data gap when the API explicitly reports one after truncation is ruled out. Do not make causal claims about crawlers or client behavior unless a grouped result supports them.
- Top-N grouped rows are partial. Describe them as top returned rows; never claim they represent all or most traffic unless their displayed counts and the authoritative total support that share.
- HTTP request volume does not establish demand, adoption, unique agents, or intentional workflow behavior. Keep observations descriptive unless the queried data directly supports a stronger conclusion across a sufficient period.

## Output

Every completed response must contain a **Results** block before commentary. A completion or progress update without that block is not a valid final response.

- Include the exact requested time window.
- Include every requested metric and its HTTP request count.
- On a follow-up asking for numbers, render the Results block again from the latest successful query instead of relying on an earlier reply.
- If a required query failed, show that metric as unavailable beside the successful totals and give the concrete error in one line.
- Put progress, task counts, warnings, interpretation, and recommendations after the Results block.

Structure the Results block by project:

- **Nuxt**
  - MCP HTTP requests and change versus the previous window.
  - Named client rows, generic HTTP-stack rows, and the empty-user-agent row as separate lists.
  - Method/status health, highlighting successful POST traffic, GET/HEAD 405 noise, and POST errors.
  - Explicit `.md` and negotiated Markdown totals, top paths, and the fact that these sets may overlap.
  - Discovery total and top discovery paths.
- **Nuxt UI**
  - MCP HTTP requests and change versus the previous window.
  - Named client rows, generic HTTP-stack rows, and the empty-user-agent row as separate lists.
  - Method/status health using the same categories as Nuxt.
  - Explicit `.md` and negotiated Markdown totals, top paths, and the fact that these sets may overlap.
  - Discovery total and top discovery paths.

After both project blocks, add up to three concise, evidence-backed observations when the returned data contains a meaningful comparison or anomaly. Cite the supporting values and omit weak commentary rather than filling space.

End with one short caveat that HTTP request volume is not logical tool-call volume.
