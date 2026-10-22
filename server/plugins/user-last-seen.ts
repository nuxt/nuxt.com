import { eq } from 'drizzle-orm'

const LAST_SEEN_RESOLUTION_MS = 24 * 60 * 60 * 1000

/**
 * Records account activity for the inactive-account sweep (at most once a day
 * per account) and signs out sessions whose account has been deleted.
 */
export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const userId = session.user?.id
    if (!userId) return

    try {
      const [row] = await db.select({ lastSeenAt: schema.users.lastSeenAt })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)

      if (!row) {
        await clearUserSession(event)
        delete session.user
        return
      }

      const now = new Date()
      if (!row.lastSeenAt || now.getTime() - row.lastSeenAt.getTime() >= LAST_SEEN_RESOLUTION_MS) {
        await db.update(schema.users).set({ lastSeenAt: now }).where(eq(schema.users.id, userId))
      }
    } catch (error) {
      useLogger(event).error(error as Error, { step: 'user-last-seen' })
    }
  })
})
