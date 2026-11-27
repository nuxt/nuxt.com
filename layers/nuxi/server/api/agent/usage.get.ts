import { defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  return checkAgentRateLimit(event)
})
