export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const result = await purgeExpiredData(db)
  useLogger(event).set({ retention: result })
  return result
})
