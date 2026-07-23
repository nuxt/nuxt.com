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

`agent/channels/discord.ts` wires Nuxi into Discord through eve's Chat SDK channel (`eve/channels/chat-sdk` + `@chat-adapter/discord`), so it behaves like Slack: **@mention Nuxi** in an allowed channel, it subscribes to the conversation, renames the thread after your message, and answers **in a thread**; follow-up messages in that thread continue the same eve session without re-mentioning.

How messages arrive: Discord does not push messages to HTTP webhooks like Slack. `agent/schedules/discord-gateway.ts` restarts a Gateway WebSocket listener every 4 minutes (270s duration, overlapping windows) that forwards events to the channel webhook at `/eve/v1/discord`. Inbound dedupe across overlapping listeners and thread subscriptions rely on the Chat SDK state adapter — **Redis (`REDIS_URL`) is required in production**; local dev falls back to in-memory state.

### One-time setup

1. **Create the application** in the [Developer Portal](https://discord.com/developers/applications) — ideally one app for preview/dev and one for prod, mirroring `slack/nuxi-preview` / `slack/nuxi`.
   - **General Information** tab: copy the **Application ID** and **Public Key**.
   - **Bot** tab: click **Reset Token** and copy the **bot token** (shown once). Under **Privileged Gateway Intents**, enable **Message Content Intent** (required to read @mentions and thread replies).
2. **Set the env vars** on the **eve** service (`vercel env`, also listed in `.env.example`):
   - `DISCORD_BOT_TOKEN` — Gateway connection + posting messages
   - `DISCORD_PUBLIC_KEY` — verifies inbound interaction signatures (HITL buttons, PING)
   - `DISCORD_APPLICATION_ID` — interaction responses
   - `DISCORD_ALLOWED_CHANNELS` — comma-separated Discord channel ids where Nuxi may run. **Unset or empty means deny everywhere.** Mentions elsewhere are silently ignored. (Get an id via right-click on the channel → **Copy Channel ID**, with Developer Mode enabled.)
   - `REDIS_URL` — Chat SDK state adapter (subscriptions, dedupe, locks); memory fallback in dev
   - `DISCORD_GATEWAY_WEBHOOK_URL` — optional override for the Gateway forward target; defaults to `https://$VERCEL_PROJECT_PRODUCTION_URL/eve/v1/discord`
3. **Invite the app to the server**: **OAuth2 → URL Generator**, scopes `bot` + `applications.commands`. Bot permissions: **View Channels**, **Send Messages**, **Create Public Threads**, **Send Messages in Threads**, **Manage Threads** (renames threads after the mention text), **Read Message History**, **Add Reactions**.
4. **Set the Interactions Endpoint URL** (General Information tab) to `https://<eve-service>/eve/v1/discord` — used for HITL button clicks and Discord's verification PING. Deploy the eve service with the env vars set **first**: Discord validates the endpoint when you save.
5. No slash command to register — the bot is mention-driven.

### Test locally

1. `pnpm dev:full`, then start a Gateway listener manually: `curl -X POST http://localhost:3000/eve/v1/dev/schedules/discord-gateway` (re-run every ~4 minutes, or rely on eve's dev scheduler).
2. @mention the bot in an allowed channel of the dev server — it should answer in a thread. For HITL buttons, the interactions endpoint additionally needs a public tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`).

### Test on preview

Eve cron schedules only run on the **production** deployment, so on a preview the Gateway listener never starts by itself — @mentions will be silently ignored until you start one:

```sh
curl -X POST "https://<preview-url>/eve/v1/ops/discord-gateway/trigger" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"
# -> { "started": true, "webhookUrl": "https://<preview-url>/eve/v1/discord" }
```

Each call opens one 270s listener window — re-run it while testing. The preview also needs the `DISCORD_*` env vars (and ideally `REDIS_URL`) available to the preview environment.

Because dispatch is restricted to the `DISCORD_ALLOWED_CHANNELS` allowlist, Discord sessions are **admin-enabled by default** (`canAccessAdminMcp` matches Discord auth, like Slack). Keep the allowlist limited to trusted team channels — widening it to public channels means revisiting the admin gate first (`agent/lib/admin-mcp-access.ts`). The rate-limit hook applies per Discord user id.

## Scheduled Slack workflows

Shared helpers live in `agent/lib/workflows.ts` (`receiveOnSlack`, auth, config). Each workflow keeps its own prompt, cron, and runner in `agent/schedules/<id>.ts`, with the procedure in `agent/skills/<id>/SKILL.md`.

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
import { receiveOnSlack, resolveSinceDays, skillWorkflowMessage } from '../lib/workflows.js'

const SKILL_ID = 'my-workflow'

export function runMyWorkflow({ receive, appAuth, sinceDays }) {
  const days = resolveSinceDays(sinceDays, 7)
  return receiveOnSlack({
    receive,
    appAuth,
    message: skillWorkflowMessage(SKILL_ID, days)
  }) // receiveOnSlack is async — export runMyWorkflow as async when wiring schedules/ops
}

export default defineSchedule({
  cron: '0 9 * * 1',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runMyWorkflow({ receive, appAuth }))
  }
})
```

### Weekly digest

- Schedule: `agent/schedules/weekly-digest.ts` — Monday 9:00 UTC
- Skill: `agent/skills/weekly-digest/SKILL.md`
- Preview trigger: `POST /eve/v1/ops/weekly-digest/trigger`

### Firehose summary

Summarizes `#firehose-nuxt` (Octolens social mentions) and posts highlights to the workflow channel.

- Schedule: `agent/schedules/firehose-summary.ts` — weekdays 9:00 UTC (last 24h)
- Skill: `agent/skills/firehose-summary/SKILL.md`
- Tool: `read_slack_channel_history` (`agent/tools/slack-channel-history.ts`)
- Preview trigger: `POST /eve/v1/ops/firehose-summary/trigger?sinceHours=24`

The Nuxi Slack bot must be invited to `#firehose-nuxt`. Required Connect scopes: `channels:read`, `channels:history` (plus `groups:read`, `groups:history` for private channels).

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

Requires on the **eve** runtime: `INTERNAL_API_SECRET`, `NUXT_MCP_ADMIN_TOKEN`, `NUXT_WORKFLOW_SLACK_CHANNEL`, `NUXT_FIREHOSE_SLACK_CHANNEL` (Slack channel names). Optional `NUXT_*_SLACK_CHANNEL_ID` overrides names and skips `users.conversations`. Local dev and Vercel preview use Connect client `slack/nuxi-preview` automatically; prod uses `slack/nuxi` (override with `SLACK_CONNECTOR`).
