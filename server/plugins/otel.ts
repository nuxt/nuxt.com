import { registerOTel } from '@vercel/otel'

/**
 * Registers the tracer `contentTracer()` (in `server/utils/tracer.ts`) hands to comarkContent
 * instances, so their parse/cache/source spans land in Vercel Observability.
 */
export default defineNitroPlugin(() => {
  if (import.meta.dev) return
  registerOTel({ serviceName: 'nuxt.com' })
})
