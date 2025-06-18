export default defineEventHandler(async (event) => {
  await requireCoreTeamUser(event)

  const drizzle = useDrizzle()

  return await drizzle.query.feedback.findMany()
})
