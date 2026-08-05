import type { ModelMessage } from 'ai'
import { defineAgent, defineDynamic } from 'eve'
import type { AuthContext } from './lib/identity/context.js'
import { nuxiGatewayOptions } from './lib/gateway-attribution.js'

const MODEL = 'anthropic/claude-sonnet-4.6'

const ANTHROPIC_OPTIONS = {
  thinking: {
    type: 'enabled',
    budgetTokens: 2048
  }
}

/**
 * Same model on every scope — only the gateway options vary, to carry the
 * `surface:*` / `feature:*` tags a digest needs to break spend down per channel.
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
        anthropic: ANTHROPIC_OPTIONS
      }
    }
  }
}

export default defineAgent({
  model: defineDynamic({
    fallback: MODEL,
    events: {
      'session.started': (_event, ctx) => selectModel(ctx.session.auth.current, ctx.messages),
      'turn.started': (_event, ctx) => selectModel(ctx.session.auth.current, ctx.messages)
    }
  }),
  // Only used if a dynamic resolver fails; resolvers degrade instead of failing
  // the turn, so the agent must still be usable on the static options.
  modelOptions: {
    providerOptions: {
      gateway: nuxiGatewayOptions(null, []),
      anthropic: ANTHROPIC_OPTIONS
    }
  },
  // Eve's default is 40M input tokens per session, which caps nothing in
  // practice. Kept generous on purpose: schedules and other task-mode sessions
  // cannot ask a human to continue, they fail with SESSION_TOKEN_LIMIT_REACHED.
  // No output cap for the same reason — thinking tokens count towards it.
  limits: {
    maxInputTokensPerSession: 4_000_000
  }
})
