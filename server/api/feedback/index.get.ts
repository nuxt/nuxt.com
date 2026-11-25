export default defineEventHandler(async (event) => {
  await requireAdminUserSession(event)

  return await db.select().from(schema.feedback)
})
