import { eq } from 'drizzle-orm'
import { z } from 'zod'

const deleteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, deleteParamsSchema.parse)

  const drizzle = useDrizzle()

  const result = await drizzle
    .delete(tables.feedback)
    .where(eq(tables.feedback.id, id))
    .returning()

  if (result.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Feedback not found'
    })
  }

  return { success: true }
})
