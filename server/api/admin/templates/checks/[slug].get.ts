/** One template's check with its phases and log, for the details panel in `/admin/templates`. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  return getTemplateCheck(getRouterParam(event, 'slug')!)
})
