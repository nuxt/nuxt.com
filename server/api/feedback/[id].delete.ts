import { eq } from 'drizzle-orm'
import { z } from 'zod'

const deleteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, deleteParamsSchema.parse)

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
