import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createError, defineHandler, readValidatedBody, setResponseStatus } from 'nuxt/server'

export default defineHandler(async (event) => {
  const { user } = await requireUserSession(event)

  // The settings page asks the user to type their username; refuse anything else so a stray request cannot delete an account.
  const { username } = await readValidatedBody(event, z.object({ username: z.string() }).parse)
  if (username.toLowerCase() !== user.username.toLowerCase()) {
    throw createError({ status: 400, statusText: 'Username does not match' })
  }

  const chats = await db.query.chats.findMany({ where: () => eq(schema.chats.userId, user.id), columns: { state: true } })

  await db.delete(schema.users).where(eq(schema.users.id, user.id))
  await clearUserSession(event)
  await endEveSessions(event, chats.map(chat => chat.state?.sessionId))

  setResponseStatus(event, 204)
  return null
})
