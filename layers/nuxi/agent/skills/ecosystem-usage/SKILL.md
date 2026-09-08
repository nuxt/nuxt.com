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

1. MCP request volume:
   - Filter: `request_path eq '/mcp' and environment eq 'production'`
   - First query ungrouped for the exact HTTP request count.
   - Then group by `client_user_agent` (limit 10), `bot_category`, and `request_method` + `http_status`.
2. Explicit Markdown URLs on Nuxt:
   - Filter: `endswith(request_path, '.md') and environment eq 'production'`
   - Query ungrouped, then group by `request_path` and `client_user_agent`.
3. Content-negotiated Markdown on Nuxt:
   - Filter: `contains(http_accept, 'text/markdown') and environment eq 'production'`
   - Query ungrouped, then group by `request_path` and `client_user_agent`.
4. Agent discovery and intake on Nuxt:
   - Filter: `(request_path eq '/llms.txt' or request_path eq '/llms-full.txt' or request_path eq '/sitemap.md' or request_path eq '/openapi.json' or request_path eq '/.well-known/mcp/server-card.json') and environment eq 'production'`
   - Query ungrouped, then group by `request_path`, `client_user_agent`, or `bot_category`.
   - Keep these separate from content reads: fetching an index or server card does not prove the client consumed a documentation page.
5. curl traffic, only when explicitly requested:
   - Filter: `contains(client_user_agent, 'curl/') and environment eq 'production'`
   - Group by `request_path` and `client_user_agent`.
   - Exclude asset paths such as `/_nuxt/`, `/_fonts/`, and image assets from the interpretation.

## Interpretation rules

- Call the result **HTTP requests**, never tool calls, sessions, users, or unique agents.
- MCP initialization, `tools/list`, `tools/call`, retries, notifications, and malformed requests each count separately.
- Empty or generic user agents (`node`, `undici`, `Go-http-client`, `python-httpx`) identify a client stack, not a specific agent product.
- `bot_category` and `bot_name` are useful classifications but do not identify every agent. Report uncategorized and HTTP-client traffic separately.
- A curl user agent does not prove an AI agent initiated the request.
- A `.md` or `/raw/**` request does not prove AI usage either: the website's “View as Markdown” and “Copy page” actions generate those requests from normal browsers. Report browser user agents separately.
- Treat explicit `Accept: text/markdown`, known AI bot categories/names, and POST `/mcp` as strong agent signals. Discovery endpoints are strong intent signals but represent intake, not necessarily document consumption.
- Web Analytics pageviews exclude most non-browser traffic. Do not use them for MCP, curl, `.md`, or `Accept: text/markdown` usage.
- If an Observability query times out, shorten the window or remove a high-cardinality grouping. Keep the ungrouped total as the authoritative number.

## Output

Lead with:

- Nuxt MCP HTTP requests and change versus the previous window.
- Nuxt UI MCP HTTP requests and change versus the previous window.
- Nuxt explicit `.md` requests.
- Nuxt negotiated Markdown requests.

Then list the top useful clients and paths, followed by one short caveat that HTTP request volume is not logical tool-call volume.
