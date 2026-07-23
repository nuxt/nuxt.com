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

`agent/channels/discord.ts` wires Nuxi into Discord through eve's HTTP Interactions channel. Unlike Slack (mentions + DMs), Discord only supports **slash commands** (`/nuxi message:...`) — no auto-replies to @mentions or free messages (that would need a Gateway bot, which eve does not support). HITL follow-ups render as buttons/selects/modals.

### One-time setup

1. **Create the application** in the [Developer Portal](https://discord.com/developers/applications) — ideally one app for preview/dev and one for prod, mirroring `slack/nuxi-preview` / `slack/nuxi`.
   - **General Information** tab: copy the **Application ID** and **Public Key**.
   - **Bot** tab: click **Reset Token** and copy the **bot token** (shown once). No privileged Gateway intents are needed — eve uses HTTP Interactions only, the bot never connects to the Gateway.
2. **Set the env vars** on the **eve** service (`vercel env`, also listed in `.env.example`):
   - `DISCORD_PUBLIC_KEY` — verifies inbound Ed25519 interaction signatures
   - `DISCORD_APPLICATION_ID` — edits deferred responses and sends followups
   - `DISCORD_BOT_TOKEN` — channel messages, typing indicators, fallback delivery
   - `DISCORD_ALLOWED_CHANNELS` — comma-separated Discord channel ids where Nuxi may run. **Unset or empty means deny everywhere.** Outside these channels the command is acknowledged with an ephemeral "Command ignored." (Get an id via right-click on the channel → **Copy Channel ID**, with Developer Mode enabled in Discord settings.)
3. **Invite the app to the server**: **OAuth2 → URL Generator**, select scopes `applications.commands` (slash commands) **and** `bot` (channel messages, typing, fallback delivery). Under bot permissions pick **View Channels** and **Send Messages** (add **Send Messages in Threads** if the allowed channels use threads). Open the generated URL and install it on the Nuxt server.
4. **Set the Interactions Endpoint URL** (General Information tab, "URL du point de terminaison des interactions") to `https://<eve-service>/eve/v1/discord`. Order matters: deploy the eve service with `DISCORD_PUBLIC_KEY` set **first** — Discord sends a signed PING when you save and rejects the URL if the endpoint doesn't answer it. For local dev the endpoint must be publicly reachable: tunnel `localhost:3000` (e.g. `cloudflared tunnel --url http://localhost:3000` or ngrok) and point the dev app's endpoint at `https://<tunnel>/eve/v1/discord`.
5. **Register the slash command** (guild command on the Nuxt server for instant propagation during dev; global — drop `/guilds/<id>` — for prod, up to ~1h propagation). The string option **must** be named `message` — it maps to eve's default prompt extraction:

```sh
# Guild command (dev, instant):
curl -X PUT "https://discord.com/api/v10/applications/$DISCORD_APPLICATION_ID/guilds/$GUILD_ID/commands" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" -H "Content-Type: application/json" \
  -d '[{"name":"nuxi","description":"Ask Nuxi","type":1,"options":[{"name":"message","description":"Your question","type":3,"required":true}]}]'

# Global command (prod): same payload against
# https://discord.com/api/v10/applications/$DISCORD_APPLICATION_ID/commands
```

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
