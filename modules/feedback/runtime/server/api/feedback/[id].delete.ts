import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { deleteMockFeedback } from '../../utils/mock-data'

const deleteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, deleteParamsSchema.parse)

  if (import.meta.dev) {
    const deleted = await deleteMockFeedback(id)
    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feedback not found'
      })
    }
    return { success: true }
  }

  const result = await db
    .delete(schema.feedback)
    .where(eq(schema.feedback.id, id))
    .returning()

  if (result.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Feedback not found'
    })
  }

  return { success: true }
})
