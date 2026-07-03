import type { GatewayProviderOptions } from '@ai-sdk/gateway'

/** Route AI Gateway requests through ZDR-compliant providers only. */
export const gatewayZeroDataRetention = {
  zeroDataRetention: true
} satisfies GatewayProviderOptions

export const gatewayProviderOptions = {
  gateway: gatewayZeroDataRetention
}
