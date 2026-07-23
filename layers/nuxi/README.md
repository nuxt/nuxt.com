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

1. Create a Discord application + bot in the [Developer Portal](https://discord.com/developers/applications) — ideally one app for preview/dev and one for prod, mirroring `slack/nuxi-preview` / `slack/nuxi`.
2. Set the env vars on the **eve** service (`vercel env`):
   - `DISCORD_PUBLIC_KEY` — verifies inbound Ed25519 interaction signatures
   - `DISCORD_APPLICATION_ID` — edits deferred responses and sends followups
   - `DISCORD_BOT_TOKEN` — channel messages, typing indicators, fallback delivery
3. Set the app's **Interactions Endpoint URL** to `https://<eve-service>/eve/v1/discord` (Discord validates the endpoint when you save).
4. Register the slash command (guild command on the Nuxt server for instant propagation during dev; global for prod). The string option **must** be named `message` — it maps to eve's default prompt extraction:

```sh
curl -X PUT "https://discord.com/api/v10/applications/$DISCORD_APPLICATION_ID/commands" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" -H "Content-Type: application/json" \
  -d '[{"name":"nuxi","description":"Ask Nuxi","type":1,"options":[{"name":"message","description":"Your question","type":3,"required":true}]}]'
```

Discord sessions are not admin-gated: `canAccessAdminMcp` only matches Slack/schedule/admin auth, and the rate-limit hook applies per Discord user id.

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
