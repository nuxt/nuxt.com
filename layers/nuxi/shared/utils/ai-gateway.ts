import type { GatewayProviderOptions } from '@ai-sdk/gateway'

/** Route AI Gateway requests through ZDR-compliant providers only. */
export const gatewayZeroDataRetention = {
  zeroDataRetention: true
} satisfies GatewayProviderOptions

export const gatewayProviderOptions = {
  gateway: gatewayZeroDataRetention
}

export function isGatewayZdrError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /no zdr|no_providers_available/i.test(message)
}
