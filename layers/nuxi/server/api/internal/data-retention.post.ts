import { defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  requireInternalRequest(event)

  const result = {
    ...await purgeExpiredNuxiData(db),
    ...await purgeExpiredSiteData(db)
  }
  useRequestLogger(event).set({ retention: result })
  return result
})
