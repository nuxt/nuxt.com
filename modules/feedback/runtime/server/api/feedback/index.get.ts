import { db, schema } from 'hub:db'
import { getMockFeedback } from '../../utils/mock-data'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  if (import.meta.dev) return await getMockFeedback()

  return await db.select().from(schema.feedback)
})
