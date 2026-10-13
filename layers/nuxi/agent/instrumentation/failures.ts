import { defineInstrumentation } from 'eve/instrumentation'
import { isRateLimitedError } from '../lib/rate-limit-error.js'

interface ToolCallState {
  toolName: string
  kind?: string
}

function errorMessage(error: unknown): string | undefined {
  if (error === undefined || error === null) return undefined
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return JSON.stringify(error)
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
        error: errorMessage(event.error)
      })
    },
    'model.call.failed': (event) => {
      console.error('[nuxi:model] call failed', {
        sessionId: event.scope.sessionId,
        turnId: event.scope.turnId,
        attempt: event.scope.attemptIndex,
        error: errorMessage(event.error)
      })
    },
    'turn.failed': (event) => {
      if (isRateLimitedError(event.error)) {
        console.warn('[nuxi:turn] rate limited', { sessionId: event.sessionId, turnId: event.turnId })
        return
      }
      console.error('[nuxi:turn] failed', {
        sessionId: event.sessionId,
        turnId: event.turnId,
        error: errorMessage(event.error)
      })
    },
    'session.failed': (event) => {
      if (isRateLimitedError(event.error)) return
      console.error('[nuxi:session] failed', {
        sessionId: event.sessionId,
        turnId: event.turnId,
        error: errorMessage(event.error)
      })
    }
  }
})
