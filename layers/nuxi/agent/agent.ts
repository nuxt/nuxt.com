import type { ModelMessage } from 'ai'
import { defineAgent, defineDynamic } from 'eve'
import { resolveContext, type AuthContext } from './lib/identity/context.js'
import { nuxiGatewayOptions } from './lib/gateway-attribution.js'

const MODEL = 'anthropic/claude-haiku-5.5'

/**
 * Low effort keeps chat replies fast; schedules have no one waiting on them and
 * chain many tool calls into a digest, so they keep the extra reasoning.
 */
function anthropicOptions(auth: AuthContext | null | undefined) {
  return {
    thinking: {
      type: 'adaptive'
    },
    effort: resolveContext(auth).surface === 'schedule' ? 'medium' : 'low'
  }
}

/**
 * Same model on every scope — only the gateway options and thinking effort
 * vary. The gateway options carry the `surface:*` / `feature:*` tags a digest
 * needs to break spend down per channel.
 * Resolving on both scopes is deliberate: `session.started` guarantees the tags
 * from the first call, `turn.started` refines them once the prompt is in history
 * (that is where a schedule's skill id becomes visible).
 */
function selectModel(auth: AuthContext | null | undefined, messages: readonly ModelMessage[]) {
  return {
    model: MODEL,
    modelOptions: {
      providerOptions: {
        gateway: nuxiGatewayOptions(auth, messages),
        anthropic: anthropicOptions(auth)
      }
    }
  }
}

export default defineAgent({
  // No fallback: since eve 0.38 a dynamic model has no compiled default and
  // sibling `modelOptions` are forbidden — a resolver failure fails the turn,
  // and every selection carries its own options through `selectModel`.
  model: defineDynamic({
    events: {
      'session.started': (_event, ctx) => selectModel(ctx.session.auth.current, ctx.messages),
      'turn.started': (_event, ctx) => selectModel(ctx.session.auth.current, ctx.messages)
    }
  }),
  // Eve's default is 40M new input tokens per window, which caps nothing in
  // practice. Kept generous on purpose: schedules and other task-mode sessions
  // cannot ask a human to continue, they fail with SESSION_USAGE_LIMIT_REACHED.
  // No output cap for the same reason — thinking tokens count towards it.
  limits: {
    sessionUsage: ({ window }) => window.inputTokens >= 4_000_000
  },
  // Keep Discord (and its optional native zlib) out of the Rolldown graph —
  // discord.js uses direct `eval` and `@discordjs/ws` optionally imports
  // `zlib-sync`, both of which spam `eve dev` compile diagnostics.
  build: {
    externalDependencies: [
      '@chat-adapter/discord',
      'discord.js',
      '@discordjs/ws',
      'zlib-sync'
    ]
  }
})
