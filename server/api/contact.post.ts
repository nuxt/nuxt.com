export default defineEventHandler(async (event) => {
  const { firstname, lastname, website, email, help, message } = await useBody(event)

  if ([firstname, lastname, website, email, help, message].some(field => !field)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request'
    })
  }

  // TODO: send email to `contact@nuxt.com`

  return {}
})
