# Nuxi layer

Nuxi is an eve agent (`agent/`) plus the nuxt.com chat UI and APIs around it. Read `README.md` for setup, and the eve guide you need in `node_modules/eve/docs/` before changing agent code.

## Layout

- `agent/instructions.md`: the always-on prompt. Rules that apply to every turn: grounding, tools, citations, length, formatting.
- `agent/instructions/*.ts`: blocks that apply only sometimes (date, surface and caller, web preview, admin). Each returns `null` when it doesn't apply. Memoize anything async per turn with `ctx.memo(ctx.turn?.id ?? null, …)`.
- `agent/channels/`: who reaches Nuxi. `slack.ts` admits only full members of the home workspace, in every hook including `onAnswers`.
- `agent/lib/identity/`: `resolveContext` is the one source of truth for surface, person and channel; `admin-mode.ts` decides admin mode per surface.
- `agent/memory/`: `personal` and `channel` slots. Scopes come from trusted auth in `lib/memory.ts`, never from model input.
- `agent/schedules/`: fixed cron workflows, plus `tasks.ts` for schedules people create in Slack.
- `evals/`: `eve eval` checks for the reply rules, with tools stubbed.

## Rules

- The agent never imports Nuxt server code. It calls `server/api/internal/*` over HTTP with `INTERNAL_API_SECRET`.
- Put company or ecosystem facts in tools, skills or connections, not in `instructions.md`.
- Keep access checks in the channel hooks and again inside any tool that reads or writes sensitive data (`assertAdminMode`).
- When you change reply behaviour in the instructions, add or update an eval under `evals/` and run it with `pnpm eval:nuxi <dir> --repeat 3`.
- Keep `evals/lib/slack.ts` in sync with `FOLLOWED_THREAD_GUIDANCE` in `agent/channels/slack.ts`.
