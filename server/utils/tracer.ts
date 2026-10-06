import { trace, type Tracer } from '@opentelemetry/api'

/**
 * Tracer for comarkContent's parse/cache/source spans, registered by `server/plugins/otel.ts`
 */
export function contentTracer(): Tracer | undefined {
  if (import.meta.dev) return undefined
  return trace.getTracer('comark-content')
}
