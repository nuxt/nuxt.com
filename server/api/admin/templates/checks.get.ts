/** Every checkable template with its last check, and the current or last run, for `/admin/templates`. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  return getTemplateChecksOverview()
})
