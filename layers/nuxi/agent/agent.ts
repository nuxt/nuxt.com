import { defineAgent } from 'eve'
import { gatewayZeroDataRetention } from '../shared/utils/ai-gateway.js'

export default defineAgent({
  model: 'anthropic/claude-sonnet-5',
  modelOptions: {
    providerOptions: {
      gateway: {
        caching: 'auto',
        ...gatewayZeroDataRetention
      },
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 2048
        }
      }
    }
  }
})
