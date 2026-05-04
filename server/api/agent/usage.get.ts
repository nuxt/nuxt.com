export default defineEventHandler(async (event) => {
  return checkAgentRateLimit(event)
})
