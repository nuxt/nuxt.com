import { lt } from 'drizzle-orm'

const RETENTION_DAYS = 30

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).cronSecret
  const authHeader = getHeader(event, 'authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const threshold = new Date()
  threshold.setDate(threshold.getDate() - RETENTION_DAYS)

  const deleted = await db.delete(schema.agentChats)
    .where(lt(schema.agentChats.updatedAt, threshold))
    .returning({ id: schema.agentChats.id })

  return { deleted: deleted.length, threshold: threshold.toISOString() }
})
