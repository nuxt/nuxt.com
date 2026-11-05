import type { GatewayProviderOptions } from '@ai-sdk/gateway'

/** Tag attached to every Nuxi AI Gateway request for spend attribution. */
export const NUXI_GATEWAY_TAG = 'app:nuxi'

/**
 * Options for the server-side one-shot calls that are not agent sessions (the
 * agent's own options are built per session in `agent/lib/gateway-attribution`).
 * Tagged like the rest so `groupBy=tag` reports stay complete — an untagged
 * `app:nuxi` row now reads as "predates per-surface tagging".
 */
export function gatewayOptionsFor(feature: string) {
  return {
    gateway: {
      zeroDataRetention: true,
      tags: [NUXI_GATEWAY_TAG, 'surface:web', `feature:${feature}`]
    } satisfies GatewayProviderOptions
  }
}

export function isGatewayZdrError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /no zdr|no_providers_available/i.test(message)
}
