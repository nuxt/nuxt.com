import { lt, sql } from 'drizzle-orm'

const CHATS_RETENTION_DAYS = 30
const USAGE_RETENTION_DAYS = 7

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).cronSecret
  const authHeader = getHeader(event, 'authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const chatsThreshold = new Date()
  chatsThreshold.setDate(chatsThreshold.getDate() - CHATS_RETENTION_DAYS)

  const deletedChats = await db.delete(schema.agentChats)
    .where(lt(schema.agentChats.updatedAt, chatsThreshold))
    .returning({ id: schema.agentChats.id })

  // `dayKey` is `rate:agent:<ip>:YYYY-MM-DD` — extract the trailing 10 chars
  // to compare lexicographically (ISO format makes this safe).
  const usageThresholdDate = new Date()
  usageThresholdDate.setDate(usageThresholdDate.getDate() - USAGE_RETENTION_DAYS)
  const usageThresholdKey = usageThresholdDate.toISOString().slice(0, 10)

  const deletedUsage = await db.delete(schema.agentDailyUsage)
    .where(sql`substr(${schema.agentDailyUsage.dayKey}, -10) < ${usageThresholdKey}`)
    .returning({ dayKey: schema.agentDailyUsage.dayKey })

  return {
    chats: { deleted: deletedChats.length, threshold: chatsThreshold.toISOString() },
    usage: { deleted: deletedUsage.length, threshold: usageThresholdKey }
  }
})
