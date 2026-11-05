export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const result = {
    ...await purgeExpiredNuxiData(db),
    ...await purgeExpiredSiteData(db)
  }
  useLogger(event).set({ retention: result })
  return result
})
