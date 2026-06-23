import { defineAgent } from 'eve'

export default defineAgent({
  model: 'anthropic/claude-sonnet-4.6',
  modelOptions: {
    providerOptions: {
      gateway: {
        caching: 'auto'
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
