export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  await adminMcpOAuth(event).cleanup()

  const result = {
    ...await purgeExpiredNuxiData(db),
    ...await purgeExpiredSiteData(db)
  }
  useLogger(event).set({ retention: result })
  return result
})
