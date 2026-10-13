import { otelIntegration } from 'eve/instrumentation/otel'
import type { ModelMessage } from 'ai'
import { resolveContext } from '../lib/identity/context.js'
import { resolveWorkflowSkill } from '../lib/gateway-attribution.js'

/**
 * No exporter on purpose: this only stamps attributes onto the AI SDK spans,
 * which every destination (Agent Runs included) then receives as
 * `ai.settings.context.nuxi.*`. Mirrors the `surface:*` / `feature:*` Gateway
 * tags so a trace and its spend line up.
 */
export default otelIntegration({
  runtimeContext({ session, modelInput }) {
    // Same principal the Gateway tags use (`agent.ts`): a person replying in a
    // scheduled Slack thread is `slack`, not `schedule`.
    const { surface } = resolveContext(session.auth.current)
    // Only readable when the trace policy captures inputs (schedules do).
    const feature = surface === 'schedule'
      ? resolveWorkflowSkill(modelInput.messages as readonly ModelMessage[])
      : undefined
    const release = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)

    return {
      'nuxi.surface': surface,
      'nuxi.subagent': session.parent !== undefined,
      ...(feature ? { 'nuxi.feature': feature } : {}),
      ...(release ? { 'nuxi.release': release } : {})
    }
  }
})
