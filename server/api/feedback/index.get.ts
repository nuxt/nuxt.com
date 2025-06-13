export default defineEventHandler(async () => {
  const drizzle = useDrizzle()

  return await drizzle.query.feedback.findMany()
})
