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

`eve.eveRoot` points Eve at this layer so `agent/` is discovered at `layers/nuxi/agent/`. The layer includes a minimal `package.json` (Eve project marker for nested layout discovery). Root `vercel.json` declares the dual `web` + `eve` services with `entrypoint: "layers/nuxi"` for Eve.

## Scheduled Slack workflows

Shared helpers live in `agent/lib/workflows.ts` (`receiveOnSlack`, auth, config). Each workflow keeps its own prompt, cron, and runner in `agent/schedules/<id>.ts`, with the procedure in `agent/skills/<id>/SKILL.md`.

### Adding a workflow

1. **Skill** — `agent/skills/<id>/SKILL.md` with `description` frontmatter and the full procedure (tool calls, output format, Slack delivery rules).
2. **Schedule** — `agent/schedules/<id>.ts`:
   - `defineSchedule({ cron, run })` calling `receiveOnSlack` (or export a `run<Id>` helper reused by ops).
   - Workflow-specific constants (`SKILL_ID`, default window, custom message) stay in this file.
3. **Preview trigger** (optional) — add `POST('/<id>/trigger', …)` in `agent/channels/ops.ts`, wired to the schedule's `run<Id>` export.
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
  })
}

export default defineSchedule({
  cron: '0 9 * * 1',
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(runMyWorkflow({ receive, appAuth }))
  }
})
```

### Weekly digest (current)

- Schedule: `agent/schedules/weekly-digest.ts` — Monday 9:00 UTC
- Skill: `agent/skills/weekly-digest/SKILL.md`
- Preview trigger: `POST /eve/v1/ops/weekly-digest/trigger`

### Test locally

With the dev server running (`pnpm dev` from repo root — Eve is bundled via the Nuxt module):

```sh
curl -X POST "http://localhost:3000/eve/v1/dev/schedules/weekly-digest"
# -> { "scheduleId": "weekly-digest", "sessionIds": ["..."] }
```

### Test on preview

```sh
curl -X POST "https://<preview-url>/eve/v1/ops/weekly-digest/trigger?sinceDays=7" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"
```

Requires on the **eve** runtime: `INTERNAL_API_SECRET`, `NUXT_MCP_ADMIN_TOKEN`, `NUXT_WORKFLOW_SLACK_CHANNEL_ID`. Local dev and Vercel preview use Connect client `slack/nuxi-preview` automatically; prod uses `slack/nuxi` (override with `SLACK_CONNECTOR`).
