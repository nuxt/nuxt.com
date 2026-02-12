import { confirmationEmailHtml } from '~~/server/utils/email-templates'

export default eventHandler(() => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404 })
  }

  return confirmationEmailHtml('https://nuxt.com/?email=preview@example.com&confirmation=abc123')
})
