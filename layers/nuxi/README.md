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

## Caller identity

`agent/lib/identity/context.ts` resolves `Context.person` (id, name, bot flag) for every surface, and `agent/lib/identity/caller-instructions.ts` renders it into the always-on prompt so "who am I?" has an answer. Discord's display name (`global_name`) comes for free from the inbound message payload; the `@`-mention handle (`username`) is still kept on the auth context for future use, it's just not what the model sees. Slack's `app_mention`/`message` events only carry a user id — `channels/slack.ts` resolves the real name via `users.info` (`agent/lib/slack/api.ts`, cached 1h per user), which needs the **`users:read`** bot scope on top of the ones above; without it, Slack callers fall back to their user id.

## Scheduled Slack workflows

Shared helpers live in `agent/lib/workflow/shared.ts` (`receiveOnSlack`, auth, config). Each workflow keeps its own prompt, cron, and runner in `agent/schedules/<id>.ts`, with the procedure in `agent/skills/<id>/SKILL.md`.

### Adding a workflow

1. **Skill** — `agent/skills/<id>/SKILL.md` with `description` frontmatter and the full procedure (tool calls, output format, Slack delivery rules).
2. **Schedule** — `agent/schedules/<id>.ts`:
   - `defineSchedule({ cron, run })` calling `receiveOnSlack` (or export a `run<Id>` helper reused by ops).
   - Workflow-specific constants (`SKILL_ID`, default window, custom message) stay in this file.
3. **Preview trigger** (optional) — add `POST('/eve/v1/ops/<id>/trigger', …)` in `agent/channels/ops.ts` (full path required for Vercel routing), wired to the schedule's `run<Id>` export.
4. **Test locally** — Eve dev dispatch (no auth): `POST /eve/v1/dev/schedules/<id>`.

Example schedule skeleton:

```ts
import { defineSchedule } from 'eve/schedules'
import { receiveOnSlack, resolveSinceDays, skillWorkflowMessage } from '../lib/workflow/shared.js'

const SKILL_ID = 'my-workflow'

export async function runMyWorkflow({ receive, appAuth, sinceDays }) {
  // No second argument: falls back to `workflow.sinceDays` in Global Config (then 7)
  const days = await resolveSinceDays(sinceDays)
  return receiveOnSlack({
    receive,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID, days)
  })
}

export default defineSchedule({
  cron: '0 9 * * 1',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runMyWorkflow({ receive, appAuth }))
  }
})
```

All times below assume UTC+1 local mornings (6:00 local ≈ 5:00 UTC) — adjust the cron if the team's timezone/DST differs.

### Weekly digest

Single Monday digest: traffic (trend, top sections, referrers/audience), docs feedback, Nuxi quality/runs, Nuxi-scoped AI Gateway spend, and **Fix this week** prioritized by traffic × feedback.

- Schedule: `agent/schedules/weekly-digest.ts` — Monday 5:00 UTC
- Skill: `agent/skills/weekly-digest/SKILL.md`
- Preview trigger: `POST /eve/v1/ops/weekly-digest/trigger`
- Traffic via `vercel-mcp__get_web_analytics`; spend via `ai_gateway__report` (scoped to `app:nuxi` tags and/or `AI_GATEWAY_REPORT_API_KEY_NAME` — never account-wide); runs via `vercel-mcp__list_agent_runs`.

### Firehose summary

Summarizes `#firehose-nuxt` (Octolens social mentions) and posts highlights to the workflow channel.

- Schedule: `agent/schedules/firehose-summary.ts` — weekdays 5:00 UTC (last 24h)
- Skill: `agent/skills/firehose-summary/SKILL.md`
- Tool: `read_slack_channel_history` (`agent/tools/slack-channel-history.ts`)
- Preview trigger: `POST /eve/v1/ops/firehose-summary/trigger?sinceHours=24`

The Nuxi Slack bot must be invited to `#firehose-nuxt`. Required Connect scopes: `channels:read`, `channels:history` (plus `groups:read`, `groups:history` for private channels).

### Discord mirror

Set `discord.digestChannel` (raw Discord channel id) in Global Config to also post the weekly digest and firehose summary to a Discord channel — distinct from `discord.channels`, which only gates live @mentions. This reuses the Slack-generated text (no second agent run): `agent/lib/discord/digest-mirror.ts` reads the finished Slack session's final message, `agent/lib/discord/format.ts` converts Slack-only syntax (`<url|label>` links, `:nuxter:`-style emoji, bare `@names`) to Discord Markdown, then posts via the unwrapped Discord adapter (so conversion runs once). Conversion is best-effort — an emoji shortcode outside the known set passes through unchanged. Unset disables the mirror; a mirroring failure is logged and never affects the Slack post. The bot needs **View Channel** + **Send Messages** in the target channel.

### Test locally

With the dev server running (`pnpm dev` from repo root — Eve is bundled via the Nuxt module):

```sh
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/weekly-digest"
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/firehose-summary"
# -> { "scheduleId": "...", "sessionIds": ["..."] }
```

### Test on preview

```sh
curl -X POST "https://<preview-url>/eve/v1/ops/weekly-digest/trigger?sinceDays=7" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

curl -X POST "https://<preview-url>/eve/v1/ops/firehose-summary/trigger?sinceHours=24" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"
```

Requires on the **eve** runtime: `INTERNAL_API_SECRET`, `NUXT_MCP_ADMIN_TOKEN`. Local dev and Vercel preview use Connect client `slack/nuxi-preview` automatically; prod uses `slack/nuxi` (override with `SLACK_CONNECTOR`). `weekly-digest` additionally needs `NUXI_VERCEL_TEAM_ID`/`NUXI_VERCEL_PROJECT_ID` (see `agent/lib/vercel-connect.ts`) and, for spend/token numbers, `AI_GATEWAY_API_KEY` (optionally `AI_GATEWAY_REPORT_API_KEY_NAME` / `AI_GATEWAY_REPORT_TAGS`) — both connections are admin-gated so only the scheduled/Slack/admin path can reach them.

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
      "public": ["6543210987654321"]
    },
    "digestChannel": "1234567890123456"
  },
  "workflow": {
    "sinceDays": 7,
    "manualTrigger": false
  }
}
```

- `admin.githubLogins` — extra admin GitHub logins on top of the core team (`server/utils/team.ts`, main Nuxt app).
- `slack` — workspace subdomain + the two known channel refs, consumed by `agent/lib/slack/config.ts` / `slack/api.ts`.
- `discord` — the live-@mention allowlist (`channels.admin`/`channels.public`) and the optional digest-mirror target (`digestChannel`), consumed by `agent/lib/discord/access.ts`.
- `workflow` — the only cross-cutting knobs left: digest window and the manual-trigger safety switch, consumed by `agent/lib/workflow/config.ts` / `workflow/shared.ts`.

Every field is optional and falls back to a sane default: `sinceDays` → 7, `slack.workspace` → `vercel`, each Slack channel's `id` → `name` → a hardcoded default (`project-nuxi`/`firehose-nuxt`, resolved via `users.conversations` — slower, and needs `channels:read`/`groups:read`), `manualTrigger` → `false` (production `/ops/*/trigger` stays disabled; preview is always allowed), `discord.digestChannel` → mirror disabled, `discord.channels` unset/empty → deny everywhere. Preview and production share the same `GLOBAL_CONFIG` store.

`admin`, `slack`, `discord`, and `workflow` are all read through `agent/lib/global-config.ts` (`readGlobalConfig`), a thin wrapper around `@vercel/global-config` that caches each key set for 30s (a single scheduled run can otherwise trigger several redundant reads of the same key) and turns a Global Config outage into a logged warning + empty result instead of an unhandled throw. Each is parsed with zod, so a malformed dashboard edit falls back to defaults with a clear warning instead of failing silently.
