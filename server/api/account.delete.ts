import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  // The settings page asks the user to type their username; refuse anything else so a stray request cannot delete an account.
  const { username } = await readValidatedBody(event, z.object({ username: z.string() }).parse)
  if (username.toLowerCase() !== user.username.toLowerCase()) {
    throw createError({ statusCode: 400, statusMessage: 'Username does not match' })
  }

  await db.delete(schema.users).where(eq(schema.users.id, user.id))
  await clearUserSession(event)

  return sendNoContent(event)
})
