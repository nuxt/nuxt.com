import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { otel } from 'eve/instrumentation/otel'

const AI_GATEWAY_ORIGIN = 'https://ai-gateway.vercel.sh'

export default otel({
  /**
   * Same as eve's default — content in development and for public
   * conversations — plus scheduled workflows: they run under the `eve:app`
   * runtime principal with a prompt we wrote, and their output is posted to a
   * team channel anyway, so metadata-only traces only made failed digests
   * harder to debug.
   */
  tracePolicy: ({ audience, environment, principalType }) => {
    const capture = environment === 'development'
      || audience === 'public'
      || principalType === 'runtime'
    return { emit: true, recordInputs: capture, recordOutputs: capture }
  },
  instrumentations: [
    // `fetch` spans for internal API calls, Slack, MCP connections, Global
    // Config. Only inside an existing trace, so request-time auth lookups don't
    // become orphan root traces; the Gateway call is already the `chat` span.
    new UndiciInstrumentation({
      requireParentforSpans: true,
      ignoreRequestHook: request => request.origin === AI_GATEWAY_ORIGIN
    })
  ]
})
