import { eq } from 'drizzle-orm'
import { z } from 'zod'

const deleteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

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
