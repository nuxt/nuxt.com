import type { ModelMessage } from 'ai'
import { defineAgent, defineDynamic } from 'eve'
import type { AdminMcpAuthContext } from './lib/admin-mcp-access.js'
import { nuxiGatewayOptions } from './lib/gateway-attribution.js'

// ZDR-attested on this Gateway account.
const MODEL = 'google/gemini-3.6-flash'

// Only applies if the Gateway falls back to Anthropic; other providers ignore it.
const ANTHROPIC_OPTIONS = {
  thinking: {
    type: 'enabled',
    budgetTokens: 2048
  }
}

// Model is fixed; only the gateway attribution tags vary per scope.
function selectModel(auth: AdminMcpAuthContext | null | undefined, messages: readonly ModelMessage[]) {
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
  // Static fallback if the dynamic resolver fails.
  modelOptions: {
    providerOptions: {
      gateway: nuxiGatewayOptions(null, []),
      anthropic: ANTHROPIC_OPTIONS
    }
  },
  // Generous on purpose: schedules can't ask a human to continue if it's hit.
  limits: {
    maxInputTokensPerSession: 4_000_000
  }
})
