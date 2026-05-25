# Spec: Rebuild Nuxi on Ash + Chat SDK

## TL;DR

Migrate Nuxi from a monolithic Nuxt server endpoint to a file-based agent
defined with [Ash](https://github.com/hugorichard/ash) (running in this repo),
exposed to the web through the [`@chat-adapter/web`](https://chat-sdk.dev/adapters/official/web)
adapter of [Chat SDK](https://chat-sdk.dev). This decouples the agent
definition (instructions, tools, MCP connections) from the transport layer,
keeps the existing `useChat` front-end protocol intact, and unlocks adding
Slack / Discord / Linear / etc. without rewriting business logic.

## Goals

1. Agent definition lives on disk in `agent/`, not inline in route handlers.
2. One handler implementation, several inbound platforms (web first, then chat
   platforms via Chat SDK adapters).
3. Front-end stays on the AI SDK UI message stream protocol — minimal client
   changes.
4. Durable runs: a request that triggers a long tool loop survives function
   restarts / cold starts.
5. Reversible. Each phase is independently shippable and revertible.

## Non-goals

- Replacing the Drizzle `chats` / `messages` tables. They remain the source of
  truth for UI state (title, history, votes, branches).
- Removing the existing `useChat` integration on the front-end.
- Adding new platforms before the web migration is stable.

## Current Architecture

Today Nuxi is implemented as a single Nuxt endpoint:

- `layers/nuxi/server/api/chats/[id].post.ts` — owns the entire AI loop
  - System prompt hard-coded as `baseSystemPrompt`
  - `streamText` from `ai` (AI SDK)
  - Tools defined inline (`showModuleTool`, `showTemplateTool`,
    `showBlogPostTool`, `showHostingTool`, `openPlaygroundTool`,
    `reportIssueTool`, `createSearchGitHubIssuesTool`)
  - MCP tools pulled from the local `/mcp` endpoint via `createMCPClient`
  - Anthropic `claude-sonnet-4-6` direct (via AI Gateway provider string)
  - Title generation done inline against `openai/gpt-4.1-nano`
  - Token / cost / duration accounting written back to `chats` row
- `app/components/agent/AgentPanel*` + `useAgentChat.ts` consume the stream
  with AI SDK's `useChat`.

Strengths: it works, the front-end is clean, the protocol is standard.
Limitations: not portable (each new platform = new code path), agent
definition is buried in TypeScript, no durability across cold starts, hard to
test in isolation.

## Target Architecture

```
                              ┌─────────────────────────────┐
 [Nuxt front: useChat]        │   Chat SDK (Chat instance)  │
            │                 │                             │
            │   POST          │   onDirectMessage           │
            ▼─────────────────▶│   onNewMention             │
 /api/chat (web webhook)      │   onSubscribedMessage       │
                              │       │                     │
 [Slack adapter]              │       ▼                     │
 [Discord adapter] ──────────▶│   Common handler:           │
 [Linear adapter]             │       invoke Ash agent      │
                              │       thread.post(stream)   │
                              └───────────┬─────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────────┐
                              │   Ash agent (agent/)        │
                              │                             │
                              │   instructions.md           │
                              │   tools/*.ts                │
                              │   connections/nuxi-mcp/     │
                              │   skills/*.md (later)       │
                              │   subagents/ (later)        │
                              │   schedules/ (later)        │
                              └─────────────────────────────┘
```

**Key invariants:**

- Chat SDK owns transport, threads, dedupe, subscriptions, message delivery.
- Ash owns the agent loop, durability, tool/MCP wiring, prompt definition.
- The bridge is one function: given a user message + auth context, run the
  Ash agent and stream chunks back to `thread.post`.
- Front-end keeps `useChat` — `@chat-adapter/web` speaks the AI SDK UI
  message stream protocol.

## Repository Layout

```
nuxt.com/
├── agent/                          # Ash agent (top-level, idiomatic Ash)
│   ├── agent.ts                    # additive runtime config (model, build…)
│   ├── instructions.md             # ex-`baseSystemPrompt`
│   ├── tools/
│   │   ├── show-module.ts
│   │   ├── show-template.ts
│   │   ├── show-blog-post.ts
│   │   ├── show-hosting.ts
│   │   ├── open-playground.ts
│   │   ├── report-issue.ts
│   │   └── search-github-issues.ts
│   ├── connections/
│   │   └── nuxi-mcp/               # connects to local /mcp endpoint
│   │       └── connection.ts
│   ├── channels/                   # optional — Chat SDK is upstream, but
│   │                               # Ash native channel can also be exposed
│   ├── skills/                     # phase 3+: extract procedures from prompt
│   ├── subagents/                  # phase 3+: e.g. doc-finder, code-reviewer
│   └── schedules/                  # phase 3+: e.g. weekly digest
├── server/
│   ├── chat.ts                     # Chat SDK Chat instance + adapter config
│   ├── api/
│   │   ├── chat.post.ts            # @chat-adapter/web webhook
│   │   └── chats/                  # existing CRUD stays for UI (history, etc.)
│   └── …
├── layers/
│   └── nuxi/                       # gets slimmer over time; UI stays here
└── specs/
    └── nuxi-on-ash.md               # this doc
```

`agent.ts` should pin the model and any Ash-level config:

```ts
import { defineAgent } from "experimental-ash";

export default defineAgent({
  model: "anthropic/claude-sonnet-4.6",  // via Vercel AI Gateway
  // workspace, build, compaction options as needed
});
```

## Migration Plan

Each phase is independently mergeable.

### Phase 1 — Chat SDK wrap, logic untouched

**Goal:** prove Chat SDK web adapter works end-to-end without changing the
AI logic yet.

1. Add deps: `chat`, `@chat-adapter/web`, `@chat-adapter/web/vue`.
2. Create `server/chat.ts`:
   ```ts
   import { Chat } from "chat";
   import { createWebAdapter } from "@chat-adapter/web";
   import { createRedisState } from "@chat-adapter/state-redis"; // or alt

   export const bot = new Chat({
     userName: "nuxi",
     adapters: {
       web: createWebAdapter({
         getUser: async (req) => {
           const session = await getUserSession(req);
           return { id: session.user?.id ?? session.id, name: session.user?.username };
         }
       })
     },
     state: createRedisState({ /* or in-memory for first PoC */ }),
   });

   bot.onDirectMessage(async (thread, message) => {
     // For phase 1: inline the current streamText logic from
     // layers/nuxi/server/api/chats/[id].post.ts
     const stream = runCurrentNuxiLoop(message.text, thread);
     await thread.post(stream);
   });
   ```
3. Create `server/api/chat.post.ts` that wires `bot.webhooks.web` to the
   route.
4. Front-end: keep `useChat`, point `api` at `/api/chat`. Thread mapping is
   `web:{user.id}:{conversationId}`.
5. Decide what to do with existing `/api/chats/[id]` endpoints: they likely
   stay for chat CRUD (list, title, branch, delete) — only the streaming POST
   gets routed through Chat SDK.
6. Validate: streaming works, `stop()` from `useChat` aborts on server, code
   snippets render, tools (`show_module` etc.) fire.

**Exit criteria:** the web experience is unchanged from the user's
perspective; the request path now goes through Chat SDK.

### Phase 2 — Extract the agent to Ash

**Goal:** move prompt, tools, and MCP wiring into `agent/`.

1. Add Ash dep: `experimental-ash` + CLI.
2. Scaffold `agent/` directory with `instructions.md`, `agent.ts`, and an
   empty `tools/` folder.
3. Move `baseSystemPrompt` body → `agent/instructions.md`. Keep the dynamic
   "Current page" prefix as a runtime context passed by the handler (Ash
   supports per-step context).
4. Convert each inline tool to `agent/tools/<name>.ts` using
   `defineTool` from `experimental-ash/tools`. Mirror current `inputSchema`
   and `execute` bodies.
5. Set up `agent/connections/nuxi-mcp/connection.ts` pointing at the local
   `/mcp` endpoint. Decide if MCP discovery happens at build-time
   (compile-once) or per-run.
6. In `server/chat.ts`, replace the inline `runCurrentNuxiLoop` with an
   invocation of the compiled Ash agent. The bridge function takes the user
   message + auth + page context and returns an `AsyncIterable` suitable for
   `thread.post`.
7. Move title generation and token/cost accounting out of the AI loop:
   - Title generation → an Ash hook or a Chat SDK side effect after the
     first user message.
   - Token / cost accounting → consume Ash's run metadata (it exposes
     model/provider/usage on session finish).
8. Update Vercel build to invoke `ash build` (or whatever the CLI is) before
   `nuxt build`. The compiled artifacts live under `.ash/` — gitignore them
   and rebuild on each deploy.

**Exit criteria:** `layers/nuxi/server/api/chats/[id].post.ts` no longer
contains a system prompt or tool definitions — only the bridge call. The
agent is fully described by files under `agent/`.

### Phase 3 — Hardening + extensions

Once phases 1 and 2 are stable:

- Extract recurring procedures from `instructions.md` into `agent/skills/`
  (e.g. "How to answer a debugging / error question", "How to handle a
  module request").
- Promote heavy sub-tasks into `agent/subagents/` (e.g. a doc-finder agent
  that owns `list-documentation-pages` + `get-documentation-page` workflows).
- Add `agent/schedules/` if any recurring task makes sense (cron-style).
- Add additional Chat SDK adapters as needed:
  - Slack: `createSlackAdapter()` → onNewMention handler already exists, no
    business logic change.
  - Discord, Linear, Telegram, etc. — same pattern.

## Storage Strategy

We have three storage layers; keep them orthogonal:

| Layer | Owns | Source of truth for |
|---|---|---|
| Drizzle `chats` / `messages` | User-visible history | Title, ordering, votes, branches, visibility, tokens/cost rollup |
| Chat SDK state | Transport bookkeeping | Subscriptions, locks, dedupe, thread→platform mapping |
| Ash sessions / runs | Agent runtime | Continuation tokens, run state, durable replay |

Decisions to make at implementation time:

- **Mapping**: the Chat SDK thread id (`web:{user.id}:{conversationId}`)
  should map 1:1 with `chats.id`. Persist this mapping or derive it.
- **Chat SDK state backend**: Redis (`@chat-adapter/state-redis`) is the
  default. We could also write a Drizzle-backed adapter to avoid a new
  service — confirm worth the effort.
- **Ash storage**: Ash has its own session/run persistence. Verify it works
  on Vercel (Fluid Compute) and check whether it needs Redis / KV / Blob.

## Auth

- The current OAuth GitHub flow in `server/api/auth/github.get.ts` stays as-is.
- The Chat SDK `getUser` function reads the existing session cookie and
  returns the same user id used everywhere else.
- The Ash agent receives the user id via the bridge call and uses it to
  scope MCP connections / rate limits / tool access.

The anonymous-vs-authenticated chat semantics from
[`server/api/auth/github.get.ts`](../server/api/auth/github.get.ts) should be
preserved: a logged-out user can still chat; their session.id is the user id
until they log in.

## Build & Deploy

- Ash compiles to `.ash/`. Add to `.gitignore`. Run `ash build` as a pre-step
  in `package.json` `build` script so Vercel picks it up.
- Verify that Ash's runtime is compatible with Vercel Fluid Compute (default).
  Both projects target Vercel, this should be fine.
- Add `agent/` and `server/chat.ts` to the deployment ignore list for
  prerender — they should not be crawled (similar to `/mcp` ignore added
  for the chat-history branch).

## Front-end Considerations

`@chat-adapter/web/vue` exposes a reactive `Chat` instance. Decide whether to:

- (A) Continue using AI SDK's `useChat` directly. The web adapter already
  speaks the AI SDK UI message stream, so this works. Simpler migration.
- (B) Switch to `@chat-adapter/web/vue`'s `useChat()` to gain Chat SDK
  features (typed threads, etc.). More idiomatic to Chat SDK.

Pick (A) for phase 1 to keep the diff small, evaluate (B) later.

## Open Questions

1. **State adapter:** Redis vs. a custom Drizzle adapter for Chat SDK state.
   What's already provisioned on Vercel? NuxtHub KV?
2. **MCP discovery timing:** Does Ash compile MCP tool catalogs at build
   time, or fetch them at run time? Affects cold start.
3. **Title generation:** Side effect outside the agent loop, or an Ash hook?
4. **Branch & explore feature:** the current `/api/chats/[id]/branch.post.ts`
   forks a conversation. Does that map cleanly to Chat SDK threads, or do we
   keep it as a custom CRUD operation that creates a new thread mapping?
5. **Admin chat view:** the dashboard listing admin chats — stays on the
   existing `/api/chats` GET endpoint, unchanged.
6. **Rate limiting:** currently `consumeAgentRateLimit(event)` happens
   per-request. Move into a Chat SDK hook or keep in the route handler?
7. **Telemetry / evlog:** the current handler wires evlog into AI SDK via
   `createAILogger` + `createEvlogIntegration`. Ash needs the equivalent —
   confirm Ash exposes hooks for per-step telemetry.

## References

- Current Nuxi entry point: `layers/nuxi/server/api/chats/[id].post.ts`
- Tools defined in `layers/nuxi/server/utils/tools/`
- Auth flow: `server/api/auth/github.get.ts`
- DB schema: `layers/nuxi/server/db/schema.ts`
- Ash: `/Users/hugorichard/Dev/ash` (local), `README.md`, `ARCHITECTURE.md`
- Chat SDK docs: https://chat-sdk.dev
- Chat SDK Web adapter: https://chat-sdk.dev/adapters/official/web
- Chat SDK Vue integration: `@chat-adapter/web/vue`

## Risks

- **Ash maturity:** the package is `experimental-ash`. Expect API churn. Pin
  versions and budget for upgrades.
- **Streaming protocol drift:** if the AI SDK UI message stream format
  changes between Chat SDK and the front-end version, debugging will be
  painful. Lock matching versions.
- **Vercel build time:** adding `ash build` to the build pipeline adds time.
  Verify it fits within the build budget (the chat-history branch already
  had build-timeout issues — addressed but a regression here would hurt).
- **Two transport frameworks:** Chat SDK and Ash both have channel concepts.
  Be deliberate about which owns what; do not duplicate.
