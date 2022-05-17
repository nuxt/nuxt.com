export default defineEventHandler(async (event) => {
  const { email, name, website, companySize, message } = await useBody(event)

  if ([email, name, website, companySize, message].some(field => !field)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request'
    })
  }

  // TODO: send email to `support@nuxt.com`

  return {}
})
