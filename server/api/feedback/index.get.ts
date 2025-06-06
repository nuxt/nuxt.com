export default defineEventHandler(async () => {
  const drizzle = useDrizzle()

  return await drizzle.select().from(tables.feedback)
})
