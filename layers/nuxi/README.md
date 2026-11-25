# Nuxi layer

Everything for the Nuxi assistant on nuxt.com lives here.

```text
layers/nuxi/
├── agent/          # Eve runtime (channels, tools, hooks) — deployed as the `eve` Vercel service
├── app/            # Chat UI (panel, dashboard, composables)
├── server/         # Nuxt APIs + internal routes the agent calls over HTTP
└── shared/         # Types and utils shared by app + server
```

## Boundaries

| Layer | Runs in | Talks to |
|-------|---------|----------|
| `agent/` | Eve (`eve dev` / Vercel `eve` service) | Nuxt via `/api/internal/*` (`INTERNAL_API_SECRET`) |
| `server/api/internal/*` | Nuxt Nitro | DB, GitHub, content — never exposed publicly |
| `server/api/chats/*`, `agent/*` | Nuxt Nitro | Browser (session auth) |
| `app/` | Browser | Nuxt APIs + Eve transport (`/_eve_internal/eve`) |

The agent never imports Nuxt server code directly. Shared logic that both sides need either lives in `shared/` (app + server) or is exposed through an internal API route.

## Config

`eve.eveRoot` points Eve at this layer so `agent/` is discovered at `layers/nuxi/agent/`. The layer includes a minimal `package.json` (Eve project marker for nested layout discovery, with `eve build` for the agent service). On Vercel, the root `eve/nuxt` module emits the dual `web` + `eve` services into `.vercel/output` during `nuxt build` — no hand-maintained root `vercel.json` is required.

## Discord channel

`agent/channels/discord.ts` wires Nuxi into Discord through eve's Chat SDK channel (`eve/channels/chat-sdk` + `@chat-adapter/discord`), so it behaves like Slack: **@mention Nuxi** in an allowed channel, it subscribes to the conversation, renames the thread after your message, and answers **in a thread**; follow-up messages in that thread continue the same eve session without re-mentioning. Channels listed under `discord.channels.autoRespond` skip the `@mention` requirement entirely — see [Auto-respond channels](#auto-respond-channels-no-mention) below.

How messages arrive: Discord does not push messages to HTTP webhooks like Slack. `agent/schedules/discord-gateway.ts` restarts a Gateway WebSocket listener every 4 minutes (270s duration, overlapping windows) that forwards events to the channel webhook at `/eve/v1/discord`. Inbound dedupe across overlapping listeners and thread subscriptions rely on the Chat SDK state adapter — **Redis (`REDIS_URL`) is required in production**; local dev falls back to in-memory state.

### One-time setup

1. **Create the application** in the [Developer Portal](https://discord.com/developers/applications) — ideally one app for preview/dev and one for prod, mirroring `slack/nuxi-preview` / `slack/nuxi`.
   - **General Information** tab: copy the **Application ID** and **Public Key**.
   - **Bot** tab: click **Reset Token** and copy the **bot token** (shown once). Under **Privileged Gateway Intents**, enable **Message Content Intent** (required to read @mentions and thread replies).
2. **Set the env vars** on the **eve** service (`vercel env`, also listed in `.env.example`):
   - `DISCORD_BOT_TOKEN` — Gateway connection + posting messages
   - `DISCORD_PUBLIC_KEY` — verifies inbound interaction signatures (HITL buttons, PING)
   - `DISCORD_APPLICATION_ID` — interaction responses
   - `REDIS_URL` — Chat SDK state adapter (subscriptions, dedupe, locks); memory fallback in dev
   - `DISCORD_GATEWAY_WEBHOOK_URL` — optional override for the Gateway forward target; defaults to `https://$VERCEL_URL/eve/v1/discord` (so previews forward to themselves), falling back to `$VERCEL_PROJECT_PRODUCTION_URL` when `VERCEL_URL` is unset
3. **Set `discord.channels`** in Global Config (`GLOBAL_CONFIG`, see `.env.example` and `agent/lib/discord/access.ts`) — editable from the Vercel dashboard with no redeploy:

   ```json
   "discord": {
     "channels": {
       "admin": ["1234567890123456"],
       "public": ["6543210987654321"],
       "autoRespond": ["1111111111111111"]
     }
   }
   ```

   `admin` channels dispatch with full admin mode (`agent/lib/identity/admin-mode.ts`); `public` and `autoRespond` channels dispatch with the public toolset only. A channel absent from all three is silently ignored. **Unset or empty means deny everywhere.** (Get an id via right-click on the channel → **Copy Channel ID**, with Developer Mode enabled.)
4. **Invite the app to the server**: **OAuth2 → URL Generator**, scopes `bot` + `applications.commands`. Bot permissions: **View Channels**, **Send Messages**, **Create Public Threads**, **Send Messages in Threads**, **Manage Threads** (renames threads after the mention text), **Read Message History**, **Add Reactions**.
5. **Set the Interactions Endpoint URL** (General Information tab) to `https://<eve-service>/eve/v1/discord` — used for HITL button clicks and Discord's verification PING. Deploy the eve service with the env vars set **first**: Discord validates the endpoint when you save.
6. No slash command to register — the bot is mention-driven.

### Test locally

1. `pnpm dev:nuxi`, then start a Gateway listener manually: `curl -X POST http://localhost:3000/eve/v1/dev/schedules/discord-gateway` (re-run every ~4 minutes, or rely on eve's dev scheduler).
2. @mention the bot in an allowed channel of the dev server — it should answer in a thread. For HITL buttons, the interactions endpoint additionally needs a public tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`).

### Test on preview

Eve cron schedules only run on the **production** deployment, so on a preview the Gateway listener never starts by itself — @mentions will be silently ignored until you start one:

```sh
curl -X POST "https://<preview-url>/eve/v1/ops/discord-gateway/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"
# -> { "started": true, "webhookUrl": "https://<preview-url>/eve/v1/discord" }
```

Each call opens one 270s listener window — re-run it while testing. The preview also needs the `DISCORD_*` env vars (and ideally `REDIS_URL`) available to the preview environment. Preview and production share the same `GLOBAL_CONFIG` store, so `discord.channels` applies to both.

Dispatch is restricted to channels listed under `discord.channels.admin`, `.public`, or `.autoRespond`; only `admin` channels get **admin mode** (`isAdminMode` — see `agent/lib/identity/admin-mode.ts`). Keep `admin` limited to trusted team channels; use `public` for channels where Nuxi should answer without the admin toolset. The rate-limit hook applies per Discord user id.

### Auto-respond channels (no `@mention`)

`discord.channels.autoRespond` answers every message in a channel with no `@mention` needed — e.g. a Discord **Forum channel** used as a support forum (each "New Post" is its own thread, like Kapa in a help forum). Wired via `bot.onNewMessage(/[\s\S]*/, …)` in `agent/channels/discord.ts`, which the Chat SDK routes to only for messages that are not an `@mention` and not already in a subscribed thread — no double dispatch with `onNewMention`. `@chat-adapter/discord` already resolves a Forum post's thread to its parent channel id before Nuxi ever sees it, so listing the Forum channel's own id here covers every post, present and future — no per-post configuration. The bot never renames the thread here (a Forum post already has its own title, unlike the mention flow's ad-hoc thread).

## Pull requests from Slack and Discord

When someone on Slack or in an admin Discord channel gives Nuxi a coding task on nuxt.com, such as a fix, a feature, a content change or a question about the code, Nuxi hands it to the `coder` subagent (`agent/subagents/coder/`). `coder` is a coding agent on Claude Opus 5.5 that delivers its changes as pull requests. It mounts [`@github-tools/eve-extension`](https://github-tools.com/integrations/eve) with the `pr-author` preset, trimmed to what opening a pull request needs. It makes the change on a new `nuxi/*` branch of `nuxt/nuxt.com` with `editFiles`, opens a pull request when it's done, and replies with the link. It never merges.

- **Who:** `coder`'s `agent.ts` returns `null` outside Slack, `discord.channels.admin` channels, and `pnpm nuxi` with `NUXI_CLI_ADMIN=1`, so the web chat, public Discord channels and schedules never see it or its tools. `githubToolsApproval` in `agent/lib/github.ts`, the root agent's `approval` policy, also covers subagents and denies every `github__*` call anywhere else.
- **Where:** `GITHUB_REPOSITORIES` in `agent/lib/github.ts` lists the repositories `coder` works on, which is `nuxt/nuxt.com` for now. `guardrails` refuse any call outside that list and any write outside `nuxi/*` branches. See [Work on another repository](#work-on-another-repository).
- **Approval:** creating the branch, committing and opening the pull request run without asking; a person reviews and merges on GitHub. `updatePullRequest` still asks the person who requested it, with **Approve** and **Deny** buttons in the thread. So does a commit to a branch that already has an open pull request (`githubToolsApproval` in `agent/lib/github.ts`): `coder` can't add to a pull request from another task, or to its own on a follow-up, without a click. The same policy denies a commit that names no branch, or a repository outside the list. It compares repository names without their case, as GitHub does. On Discord, the buttons need the Interactions Endpoint URL from the [Discord setup](#discord-channel).
- **Tools:** `coder` changes code through the GitHub API only. Its sandbox holds a browser and no checkout, see [Browser and captures](#browser-and-captures). `coder/tools/` disables `edit_file` and `write_file`, and keeps `bash` and `read_file` to work on files in the sandbox, such as a capture or a logo. It keeps `web_search` and `web_fetch` to read docs, issues and pages linked in the request. `web_fetch` stays off on the root agent, which serves public chats.

On Slack, Nuxi first moves the request into a [code channel](https://docs.slack.dev/ai/slack-code) with `tools/open_code_channel.ts`, offered to the same people as `coder`. The channel starts with the thread so far and invites the person who asked. Every message in it reaches Nuxi without a mention, the whole channel is one session, and anyone in it can stop the agent from Slack. This needs **Code Channels** turned on in the `slack/nuxi` and `slack/nuxi-preview` connector settings, which adds the `code_channels:manage` scope and the `message.session` and `agent_session_stopped` events, plus the `groups:read` and `mpim:read` bot scopes. Discord has no equivalent and keeps using threads.

Auth uses the `nuxi-code` GitHub App on the `nuxt` org through the Vercel Connect connector `github/nuxi-code`, connected to every environment of the project. `coder` runs with `actAs: 'caller'`: every call uses the GitHub token of the person who asked, so the branch, commits and pull request are theirs, and GitHub enforces their own access to `nuxt/nuxt.com`. The extension's `attribution` still credits the App: the pull request body ends with "Generated by nuxi-code", and the commits list the App's bot as co-author. The first time someone asks, Nuxi replies with a sign-in button to authorize the App on their GitHub account; the task continues once they have. A person never falls back to the App's own token. Only `pnpm nuxi` with `NUXI_CLI_ADMIN=1`, which has no GitHub user, runs as the App, so local tests act with the App's permissions. `searchCode` is excluded because its free-text query can name another repository, which the `repositories` guardrail can't check. The App needs **Contents** and **Pull requests** (read and write) and **Metadata** (read).

### Browser and captures

`coder` has its own sandbox (`coder/sandbox.ts`) with Chromium, [agent-browser](https://agent-browser.dev) and ffmpeg. It uses the sandbox to look at pages, and to produce the images a task needs instead of leaving them to a person. For example, a showcase pull request arrives with its screenshot and logo. A task that only asks for a capture, such as a clip of a page for a Slack reply, opens no pull request.

- **Browser:** `coder/extensions/browser/` mounts [`@agent-browser/eve`](https://www.npmjs.com/package/@agent-browser/eve) as `browser__*`, which opens and operates any public page. The sandbox holds no credentials and no checkout, so `coder` can't run the site or capture its own branch. On Vercel, the sandbox's firewall refuses every connection to a private address (`networkPolicy` in `coder/sandbox.ts`). A local Docker sandbox has no such rule: there, the capture tools only refuse a URL that names a private address. The capture tools drive the same browser, so their calls run one at a time, even when the model asks for several together.
- **`capture_screenshot`:** saves a 2560×1440 WebP, the format of `public/assets/websites/`, and shows the frame to the model. Its `cookies`, `hideElements`, `removeElements`, `scripts` and `delay` options match `screenshotOptions` in `content/showcase.yml`.
- **`record_video`:** plays a list of steps with a visible cursor, saves an MP4 without sound, and shows six frames spread over the clip to the model. GitHub plays a video inline only from its own attachments, which is where `publish_media` uploads it.
- **`publish_media`:** uploads a capture to GitHub as an attachment of the repository, the upload behind [`gh --attach`](https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli), and returns its link and its Markdown once GitHub serves it. This is how a capture reaches a pull request body, and nothing is written to the repository. An image embeds as `![alt](url)`, and the URL of a clip alone on a line renders as a video player. GitHub serves the link to everyone only once a pull request, an issue or a comment of a public repository embeds it, so the link of a capture that no pull request embeds, such as one made for a Slack reply, can answer 404. GitHub has no way to delete an attachment.
- **`commit_assets`:** commits images to a `nuxi/*` branch, because `editFiles` writes text only. It accepts images of 4 MB at most whose bytes match their extension, which covers a blog cover at 2400x1260. The showcase skill holds its screenshots under 1 MB with a lower `capture_screenshot` `quality`. It uses the same GitHub token as the GitHub tools. Unlike `editFiles`, its commits don't list the App's bot as co-author.

Every one of these tools calls `assertCanUseGithubTools`, so they are available to the same people as the GitHub tools. Two skills in `coder/skills/` hold the procedures: `showcase-entry` for a complete showcase entry, and `visual-evidence` for the captures of a pull request.

Setup:

- **Deploys:** `eve build` installs the browser into a sandbox snapshot once per build, which takes about a minute. Sessions start from that snapshot.
- **Files from the conversation:** eve saves a file attached to a Slack message in the sandbox of the root session, under `/workspace/.eve/attachments/`. `coder` has its own sandbox and receives only the text of its task, so the file crosses in two steps. The root agent calls `share_attachments` (`agent/tools/`, offered to the same people as `coder`) with the attachment paths, which copies the files to a store under the session's id. `coder` then calls `receive_attachments`, which reads the store under the id of its parent session and writes the files to `/workspace/shared/`, each under the directory name eve gave it, where `bash`, `read_file` and `commit_assets` reach them. The model never names a session, so a `coder` only gets the files of the conversation that started it. Up to 5 files of 10 MB per call, kept for an hour. The store (`agent/lib/handoff.ts`) is the Redis of `REDIS_URL`, the one the Discord channel uses, under `nuxi:handoff:*`. Without `REDIS_URL` it is a local temp directory, which only works on one machine: on Vercel the tool fails and names the variable, so set `REDIS_URL` on every environment that should pass files, previews included.
- **Local:** the browser needs Docker running before `pnpm nuxi`. The first browser call builds the sandbox image, which takes about two minutes. Without Docker, eve falls back to just-bash, which runs no native binaries, so the browser and capture tools fail. On Apple Silicon, the Docker sandbox gets no browser, because Chrome for Testing has no Linux arm64 build.
- **Attachment token:** `publish_media` needs `NUXI_GITHUB_ATTACHMENTS_PAT` on the eve service, a GitHub personal access token. GitHub accepts the attachment upload from a personal access token only: it answers 404 to the `nuxi-code` installation token and to the token of a person signed in through the App ([cli/cli#14309](https://github.com/cli/cli/issues/14309)). So this tool never uses the token of the person who asked, and every attachment belongs to the token's account. That account needs write access to each repository in `GITHUB_REPOSITORIES`, and a classic token needs the `repo` scope. Use a token of a bot account instead of a person's. Without the variable, the tool reports that it has no token, and the other tools still work.
- **Local GitHub access:** the GitHub tools and `commit_assets` need a linked Vercel project (`vercel link`), because Vercel Connect authenticates with the project's OIDC token. Without it, they fail with `VercelOidcTokenError`.
- **Local publishing:** set `NUXI_GITHUB_ATTACHMENTS_PAT` in `.env`. It needs no Vercel project.
- **`--no-default-extensions`:** the `dev` script passes this flag to turn off eve's bundled self-modification subagent. That subagent uses a just-bash sandbox, and eve prepares every sandbox when `coder` first opens its own. Preparing it runs `pnpm add just-bash` in `layers/nuxi`, which fails on the ignored build scripts and leaves a stray lockfile.

### Work on another repository

Nothing in `coder`'s tools is specific to `nuxt/nuxt.com`. To let it work on another repository:

1. Add the repository to `GITHUB_REPOSITORIES` in `agent/lib/github.ts`. The first entry stays the default.
2. Give the `nuxi-code` GitHub App access to the repository, and give the account of `NUXI_GITHUB_ATTACHMENTS_PAT` write access to it.
3. Add a section for it to `coder/instructions.md`, like the `nuxt/nuxt.com` one. Say where its site is deployed, where its images live, and how its pull requests preview.

`commit_assets` and `publish_media` take the repository as an input, and the `github__*` tools take `owner` and `repo`.

## Caller identity

`agent/lib/identity/context.ts` resolves `Context.person` (id, name, bot flag) for every surface, and `agent/lib/identity/caller-instructions.ts` renders it into the always-on prompt so "who am I?" has an answer. Discord's display name (`global_name`) comes for free from the inbound message payload; the `@`-mention handle (`username`) is still kept on the auth context for future use, it's just not what the model sees. Slack's `app_mention`/`message` events only carry a user id — `channels/slack.ts` resolves the real name via `users.info` (`agent/lib/slack/api.ts`, cached 1h per user), which needs the **`users:read`** bot scope on top of the ones above; without it, Slack callers fall back to their user id.

## Data retention

`agent/schedules/data-retention.ts` calls `POST /api/internal/data-retention` daily at 3:30 UTC. The route runs `purgeExpiredNuxiData` (`server/utils/data-retention.ts`), which deletes:

- chats not updated for 12 months (their messages and votes cascade)
- `agent_daily_usage` counters older than 7 days

It then runs the main app's `purgeExpiredSiteData`, which deletes accounts not seen for 12 months and page feedback older than 12 months.

Each run deletes at most 5,000 rows per table, so a backlog drains over several runs. Test locally with `curl -X POST "http://localhost:3000/eve/v1/dev/schedules/data-retention"`.

## Scheduled Slack workflows

Shared helpers live in `agent/lib/workflow/shared.ts` (`sendToSlack`, auth, config). Each workflow keeps its own prompt, cron, and runner in `agent/schedules/<id>.ts`, with the procedure in `agent/skills/<id>/SKILL.md`.

### Adding a workflow

1. **Skill** — `agent/skills/<id>/SKILL.md` with `description` frontmatter and the full procedure (tool calls, output format, Slack delivery rules).
2. **Schedule** — `agent/schedules/<id>.ts`:
   - `defineSchedule({ cron, run })` calling `sendToSlack` (or export a `run<Id>` helper reused by ops).
   - Workflow-specific constants (`SKILL_ID`, default window, custom message) stay in this file.
3. **Preview trigger** (optional) — add `POST('/eve/v1/ops/<id>/trigger', …)` in `agent/channels/ops.ts` (full path required for Vercel routing), wired to the schedule's `run<Id>` export.
4. **Test locally** — Eve dev dispatch (no auth): `POST /eve/v1/dev/schedules/<id>`.

Example schedule skeleton:

```ts
import { defineSchedule } from 'eve/schedules'
import { sendToSlack, resolveSinceDays, skillWorkflowMessage } from '../lib/workflow/shared.js'

const SKILL_ID = 'my-workflow'

export async function runMyWorkflow({ to, appAuth, sinceDays }) {
  // No second argument: falls back to `workflow.sinceDays` in Global Config (then 7)
  const days = await resolveSinceDays(sinceDays)
  return sendToSlack({
    to,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID, days)
  })
}

export default defineSchedule({
  cron: '0 9 * * 1',
  async run({ to, waitUntil, appAuth }) {
    waitUntil(runMyWorkflow({ to, appAuth }))
  }
})
```

All schedules use UTC and do not shift with daylight saving time. Reports are spread across the week; the standalone SEO report runs twice per calendar month.

| Workflow | Schedule (UTC) |
| --- | --- |
| Firehose summary | Weekdays at 08:00 |
| Weekly digest | Monday at 09:00 |
| Showcase check | Tuesday at 09:00 |
| Showcase discovery | Thursday at 09:00 |
| SEO opportunities | 1st and 15th of each month at 10:00 |

### Weekly digest

Single Monday digest: traffic (trend, top sections, referrers/audience), Search Console changes and SEO recommendations, docs feedback, Nuxi quality/runs, Nuxi-scoped AI Gateway spend, and **Fix this week** prioritized by traffic, feedback and evidenced opportunities.

- Schedule: `agent/schedules/weekly-digest.ts` — Monday 09:00 UTC
- Skill: `agent/skills/weekly-digest/SKILL.md`
- Preview trigger: `POST /eve/v1/ops/weekly-digest/trigger`
- Browser traffic via `vercel-mcp__count_pageviews` + `vercel-mcp__aggregate_pageviews`.
- MCP and agent-facing traffic via the read-only `vercel-mcp__create_observability_query` tool using `vercel.request.count`: Nuxt and Nuxt UI each report `/mcp`, explicit `.md` URLs, `Accept: text/markdown`, and discovery endpoints such as `/llms.txt`. The reusable ad-hoc recipe is in `agent/skills/ecosystem-usage/SKILL.md`.
- Spend via `ai_gateway__report` (scoped to `app:nuxi` tags and/or `AI_GATEWAY_REPORT_API_KEY_NAME` — never account-wide); runs via `vercel-mcp__list_agent_runs`.
- Search via the admin MCP's Search Console tools, using the digest's N-day window ending 3 days ago and the preceding equal-length window. `seo-opportunities` owns the reusable analysis procedure; compact mode validates at most 2 pages.

### Firehose summary

Summarizes `#firehose-nuxt` (Octolens social mentions) and posts highlights to the workflow channel.

- Schedule: `agent/schedules/firehose-summary.ts` — weekdays 08:00 UTC (last 24h)
- Skill: `agent/skills/firehose-summary/SKILL.md`
- Tool: `read_slack_channel_history` (`agent/tools/slack-channel-history.ts`)
- Preview trigger: `POST /eve/v1/ops/firehose-summary/trigger?sinceHours=24`

The Nuxi Slack bot must be invited to `#firehose-nuxt`. Required Connect scopes: `channels:read`, `channels:history` (plus `groups:read`, `groups:history` for private channels).

### Showcase check

Fetches the homepage of every site on `/showcase` and flags the ones that no longer serve Nuxt, so they can be removed or updated in `content/showcase.yml`.

- Schedule: `agent/schedules/showcase-check.ts` — Tuesday 09:00 UTC
- Skill: `agent/skills/showcase-check/SKILL.md`
- Tool: `check_showcase_sites` (`agent/tools/check_showcase_sites.ts`, admin only) — also answers ad-hoc questions such as "is Upwork still on Nuxt?"
- Preview trigger: `POST /eve/v1/ops/showcase-check/trigger`

The site list comes from `POST /api/internal/content` (`kind: "showcase"`), so the check always matches what is live. Detection lives in `agent/lib/showcase/check.ts`: any Nuxt marker (`__NUXT_DATA__`, `window.__NUXT__`, `#__nuxt`, `/_nuxt/`, `data-n-head`) confirms a site. A site is only reported as switched when it served a real page without one. Sites behind bot protection (Cloudflare, Akamai, Vercel challenge) often reject requests from Vercel's datacenter IPs, and which ones do changes from run to run; they are listed as "couldn't check", never as switched.

### Showcase discovery

Finds candidates to consider adding, separately from checking existing entries.

- Schedule: `agent/schedules/showcase-discovery.ts` — Thursday 09:00 UTC
- Skill: `agent/skills/showcase-discovery/SKILL.md` (also available on request)
- Tool: `discover_showcase_candidates` — admin only, with per-call authorization; `sinceDays` defaults to 7 and `limit` to 20 (maximum 30).
- Preview trigger: `POST /eve/v1/ops/showcase-discovery/trigger?sinceDays=7`

Reads the public `https://nuxt.fyi/api/hits?page=N&sort=scanned_at&order=desc` feed (at most 3 pages), filters by scan date and source safety label, excludes current showcase hosts (including `www` and final redirect hosts), and deduplicates results. Lower Tranco rank sorts first, then most recent scan; unranked sites remain eligible. The result includes titles, detection signals and nuxt.fyi evidence links. The skill shortlists at most 5 with a reason to review each; it does not add content or contact site owners.

These are recent scans, including rescans, not necessarily newly launched sites. The API is public but not a versioned contract; schema/HTTP failures surface explicitly. Pagination or sort mismatches stop discovery with a coverage warning. Reports disclose the bounded sample and any omitted candidates. `api/recent` was tested but ignored requested filters on the live service, so this workflow uses the Nuxt-only hits feed. No API key or arbitrary candidate-site fetching is required.

### SEO opportunities

- Schedule: `agent/schedules/seo-opportunities.ts` — 1st and 15th of each month at 10:00 UTC
- Skill: `agent/skills/seo-opportunities/SKILL.md` (also available on request)
- Preview trigger: `POST /eve/v1/ops/seo-opportunities/trigger?sinceDays=28` (1–90 days)

Uses the existing admin MCP tools `search-console-analytics`, `search-console-inspect-url`, `search-console-sitemaps`, `page-head` and `crux-web-vitals`. The standalone report defaults to 28 days independently of `workflow.sinceDays`; it compares explicit equal-length windows ending 3 days ago. The twice-monthly reports intentionally overlap their rolling 28-day windows to retain enough data for trends; this is not a half-month reporting window. By default every analytics call includes nuxt.com and all its subdomains (HTTP and HTTPS), including ui.nuxt.com. The scorecard covers this whole domain scope; a selected **By site** breakdown uses separately queried host totals, and every page finding is labelled with its actual hostname. Ungrouped totals and daily trends establish the overview; page comparisons identify both gains and losses. Up to 5 pages receive paired query comparisons and current-content/feedback/indexing/field-performance checks before recommendations.

The Slack report is a short briefing: **Scorecard**, **What improved**, **What regressed**, **Do next**, and **Watch next**. It prioritizes up to 3 specific changes (such as a drafted snippet, a named section/example to add, or a verified internal link), each with evidence, effort and a success check. Each loss and action shows its share of the total click change, and actions are ordered by that share. A URL that redirects is reported as a move: the report combines the old and new URL instead of flagging a ranking loss. Monitoring names the page/query, baseline, review timing and a proposed investigation trigger. Unread pages and unavailable comparisons are explicit limitations, not speculative rewrites. Compact weekly-digest mode keeps a gain, a loss and the best action. Neither workflow changes pages nor submits indexing requests. Missing credentials or API failures remain visible and do not prevent the rest of the weekly digest.

Both standalone and compact reports check daily date coverage before calculating changes. Search Console retains only 16 months, and reporting can lag beyond 3 days. Incomplete or unverified windows show separately labelled available totals and a coverage limitation instead of misleading period deltas. On request, the skill can narrow the report to an exact host using a replacement filter and suitable content readers. The admin SEO MCP prompt exposes the same selection through `host` (default `*.nuxt.com`, which includes the apex too). URL-prefix Search Console properties may not cover subdomains; the report must disclose that limitation. Content readers, docs feedback and origin performance evidence must match the actual site; nuxt.com evidence cannot be attributed to another host.

The Google credentials belong on the **Nuxt web runtime**, which serves `/mcp/admin`: `NUXT_GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`, `NUXT_GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`, optionally `NUXT_GOOGLE_SEARCH_CONSOLE_SITE_URL` (default `sc-domain:nuxt.com`), and `NUXT_GOOGLE_CRUX_API_KEY`. The service account needs read access to that Search Console property. Eve reuses `NUXT_MCP_ADMIN_TOKEN`; no Google credentials are passed to the model.

### Discord mirror

Set `discord.digestChannel` (raw Discord channel id) in Global Config to also post workflow reports to a Discord channel — distinct from `discord.channels`, which only gates live @mentions. This reuses the Slack-generated text (no second agent run): `agent/lib/discord/digest-mirror.ts` reads the finished Slack session's final message, `agent/lib/discord/format.ts` converts Slack-only syntax (`<url|label>` links, `:nuxter:`-style emoji, bare `@names`) to Discord Markdown, then posts via the unwrapped Discord adapter (so conversion runs once). Conversion is best-effort — an emoji shortcode outside the known set passes through unchanged. Unset disables the mirror; a mirroring failure is logged and never affects the Slack post. The bot needs **View Channel** + **Send Messages** in the target channel.

### Test locally

With the dev server running (`pnpm dev` from repo root — Eve is bundled via the Nuxt module):

```sh
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/weekly-digest"
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/firehose-summary"
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/showcase-check"
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/showcase-discovery"
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/seo-opportunities"
# -> { "scheduleId": "...", "sessionIds": ["..."] }
```

### Test on preview

```sh
curl -X POST "https://<preview-url>/eve/v1/ops/weekly-digest/trigger?sinceDays=7" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

curl -X POST "https://<preview-url>/eve/v1/ops/firehose-summary/trigger?sinceHours=24" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

curl -X POST "https://<preview-url>/eve/v1/ops/showcase-check/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

curl -X POST "https://<preview-url>/eve/v1/ops/showcase-discovery/trigger?sinceDays=7" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

curl -X POST "https://<preview-url>/eve/v1/ops/seo-opportunities/trigger?sinceDays=28" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"
```

Requires on the **eve** runtime: `INTERNAL_API_SECRET`, `NUXT_MCP_ADMIN_TOKEN`. Local dev and Vercel preview use Connect client `slack/nuxi-preview` automatically; prod uses `slack/nuxi` (override with `SLACK_CONNECTOR`). `weekly-digest` additionally needs `NUXI_VERCEL_TEAM_ID`, `NUXI_VERCEL_PROJECT_ID` (nuxt.com), and `NUXI_VERCEL_NUXT_UI_PROJECT_ID` (Nuxt UI) plus, for spend/token numbers, `AI_GATEWAY_API_KEY` (optionally `AI_GATEWAY_REPORT_API_KEY_NAME` / `AI_GATEWAY_REPORT_TAGS`) — both connections are admin-gated so only the scheduled/Slack/admin path can reach them.

### Global Config

One root key per surface — each self-contained, so you never have to jump elsewhere to see all of a surface's config:

```json
{
  "admin": {
    "githubLogins": ["some-github-login"]
  },
  "slack": {
    "workspace": "vercel",
    "channels": {
      "digest": { "id": "C0123ABC", "name": "project-nuxi" },
      "firehose": { "id": "C0456DEF", "name": "firehose-nuxt" }
    }
  },
  "discord": {
    "channels": {
      "admin": ["1234567890123456"],
      "public": ["6543210987654321"],
      "autoRespond": ["1111111111111111"]
    },
    "digestChannel": "1234567890123456"
  },
  "workflow": {
    "sinceDays": 7,
    "manualTrigger": false
  }
}
```

- `admin.githubLogins` — extra admin GitHub logins on top of the core team (`server/utils/team.ts`, main Nuxt app). Locally (and on preview), `NUXT_ADMIN_GITHUB_LOGINS` is a comma-separated overlay of the same list so you can test web-chat admin without Global Config; ignored when `VERCEL_ENV=production`. Re-sign-in after changing it.
- `slack` — workspace subdomain + the two known channel refs, consumed by `agent/lib/slack/config.ts` / `slack/api.ts`.
- `discord` — the live-dispatch allowlist (`channels.admin` / `channels.public` / `channels.autoRespond`) and the optional digest-mirror target (`digestChannel`), consumed by `agent/lib/discord/access.ts`. `admin` grants admin mode; `public` and `autoRespond` stay on the public toolset (`autoRespond` answers without an `@mention`).
- `workflow` — the only cross-cutting knobs left: digest window and the manual-trigger safety switch, consumed by `agent/lib/workflow/config.ts` / `workflow/shared.ts`.

Every field is optional and falls back to a sane default: `sinceDays` → 7, `slack.workspace` → `vercel`, each Slack channel's `id` → `name` → a hardcoded default (`project-nuxi`/`firehose-nuxt`, resolved via `users.conversations` — slower, and needs `channels:read`/`groups:read`), `manualTrigger` → `false` (production `/ops/*/trigger` stays disabled; preview is always allowed), `discord.digestChannel` → mirror disabled, `discord.channels` unset/empty → deny everywhere. Preview and production share the same `GLOBAL_CONFIG` store.

`admin`, `slack`, `discord`, and `workflow` are all read through `agent/lib/global-config.ts` (`readGlobalConfig`), a thin wrapper around `@vercel/global-config` that caches each key set for 30s (a single scheduled run can otherwise trigger several redundant reads of the same key) and turns a Global Config outage into a logged warning + empty result instead of an unhandled throw. Each is parsed with zod, so a malformed dashboard edit falls back to defaults with a clear warning instead of failing silently.
