export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const drizzle = useDrizzle()

  return await drizzle.query.feedback.findMany()
})
