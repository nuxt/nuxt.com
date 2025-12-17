import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  return await db.select().from(schema.feedback)
})
