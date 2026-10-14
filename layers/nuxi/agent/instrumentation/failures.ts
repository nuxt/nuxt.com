import { defineInstrumentation } from 'eve/instrumentation'

interface ToolCallState {
  toolName: string
  kind?: string
}

/**
 * Upstream messages can quote credentials or conversation content, so only the
 * error's class and code reach the logs. The full error stays on the Agent
 * Runs span for the same session id.
 */
function errorKind(error: unknown): { name?: string, code?: string } | undefined {
  if (error === undefined || error === null) return undefined
  if (typeof error !== 'object') return { name: typeof error }
  const name = error instanceof Error ? error.name : error.constructor?.name
  const code = 'code' in error && (typeof error.code === 'string' || typeof error.code === 'number')
    ? String(error.code)
    : undefined
  return { ...(name ? { name } : {}), ...(code ? { code } : {}) }
}

/**
 * Agent Runs is for browsing, not alerting: failures only become searchable
 * (and alertable) in the eve service's runtime logs. Every line carries the
 * session id, which is the Agent Runs conversation id.
 */
export default defineInstrumentation({
  // Error details only — prompts and model output never reach runtime logs.
  tracePolicy: () => ({ emit: true, recordInputs: false, recordOutputs: true }),
  events: {
    'tool.call.started': (event, ctx) => {
      const state: ToolCallState = event.kind
        ? { toolName: event.toolName, kind: event.kind }
        : { toolName: event.toolName }
      ctx.state.set({ ...state })
    },
    'tool.call.failed': (event, ctx) => {
      const started = ctx.state.get() as ToolCallState | undefined
      const outcome = event.outcome ?? 'failed'
      const log = outcome === 'failed' ? console.error : console.warn
      log('[nuxi:tool] call did not complete', {
        sessionId: event.scope.sessionId,
        turnId: event.scope.turnId,
        tool: started?.toolName,
        kind: started?.kind,
        outcome,
        errorCode: event.errorCode,
        error: errorKind(event.error)
      })
    },
    'model.call.failed': (event) => {
      console.error('[nuxi:model] call failed', {
        sessionId: event.scope.sessionId,
        turnId: event.scope.turnId,
        attempt: event.scope.attemptIndex,
        error: errorKind(event.error)
      })
    },
    'turn.failed': (event) => {
      console.error('[nuxi:turn] failed', {
        sessionId: event.sessionId,
        turnId: event.turnId,
        error: errorKind(event.error)
      })
    },
    'session.failed': (event) => {
      console.error('[nuxi:session] failed', {
        sessionId: event.sessionId,
        turnId: event.turnId,
        error: errorKind(event.error)
      })
    }
  }
})
