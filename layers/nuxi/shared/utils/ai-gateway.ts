import type { GatewayProviderOptions } from '@ai-sdk/gateway'

/** Tag attached to every Nuxi AI Gateway request for spend attribution. */
export const NUXI_GATEWAY_TAG = 'app:nuxi'

/** Route AI Gateway requests through ZDR-compliant providers only, tagged for reporting. */
export const gatewayZeroDataRetention = {
  zeroDataRetention: true,
  tags: [NUXI_GATEWAY_TAG]
} satisfies GatewayProviderOptions

export const gatewayProviderOptions = {
  gateway: gatewayZeroDataRetention
}

export function isGatewayZdrError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /no zdr|no_providers_available/i.test(message)
}
