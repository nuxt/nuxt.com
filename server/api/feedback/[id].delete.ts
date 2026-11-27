import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createError, defineHandler } from 'nuxt/server'

const deleteParamsSchema = z.object({
  id: z.coerce.number()
})

export default defineHandler(async (event) => {
  await requireAdminUserSession(event)

  const { id } = await getValidatedParams(event, deleteParamsSchema.parse)

  const result = await db
    .delete(schema.feedback)
    .where(eq(schema.feedback.id, id))
    .returning()

  if (result.length === 0) {
    throw createError({
      status: 404,
      statusText: 'Feedback not found'
    })
  }

  return { success: true }
})
