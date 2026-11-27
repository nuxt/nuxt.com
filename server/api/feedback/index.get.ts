import { defineHandler } from 'nuxt/server'

export default defineHandler(async (event) => {
  await requireAdminUserSession(event)

  return await db.select().from(schema.feedback)
})
